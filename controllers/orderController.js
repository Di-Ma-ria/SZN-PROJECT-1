import { Order }     from '../models/orderModel.js';
import { Inventory } from '../models/inventoryModel.js';
import { Coupon }    from '../models/couponModel.js';
import { Product }   from '../models/productModel.js';
import { sendTemplateEmail } from '../utils/sendEmail.js';


// Atomic inventory deduction.

const deductInventory = async (items) => {
  const deductedItems = [];

  for (const item of items) {
    // Atomic — only deducts if enough stock exists, if two people try at same time only one succeeds
    const record = await Inventory.findOneAndUpdate(
      {
        product:  item.product,
        quantity: { $gte: item.quantity },
      },
      {
        $inc: { quantity: -item.quantity }, 
      },
      { new: true }
    );

    // If null — stock ran out, someone else got the last item
    if (!record) {
      // Restore items already deducted in this loop
      if (deductedItems.length > 0) {
        await restoreInventory(deductedItems);
      }
      throw new Error(
        `Sorry! "${item.name}" just went out of stock...`
      );
    }

    deductedItems.push(item);
  }
};

// Restore inventory on cancellation 
const restoreInventory = async (items) => {
  for (const item of items) {
    await Inventory.findOneAndUpdate(
      { product: item.product },
      { $inc: { quantity: item.quantity } }
    );
  }
};


// PLACE ORDER
export const placeOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, couponCode, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item',
      });
    }

    //Guard: seller cannot order their own products
    for (const item of items) {
      const product = await Product.findById(item.product).select('seller');
      if (product && product.seller.toString() === req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: `You cannot purchase your own product: "${item.name}"`,
        });
      }
    }

    // Re-validate prices and stock before ordering
    const priceChangedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product)
        .select('basePrice discountPercentage status name');

      if (!product || product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `"${item.name}" is no longer available`,
        });
      }

      const currentPrice =
        product.discountPercentage > 0
          ? product.basePrice * (1 - product.discountPercentage / 100)
          : product.basePrice;

      const priceDiff = Math.abs(currentPrice - item.price);
      if (priceDiff > 0.01) {
        priceChangedItems.push({
          name:     item.name,
          oldPrice: item.price,
          newPrice: Number(currentPrice.toFixed(2)),
        });
      }
    }

    if (priceChangedItems.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Some item prices have changed. Please review your cart.',
        priceChangedItems,
      });
    }

    // Stock check before atomic deduction, gives friendly message early, before payment attempt.

    for (const item of items) {
      const inventory = await Inventory.findOne({ product: item.product });
      if (!inventory || inventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sorry! "${item.name}" only has ${inventory?.quantity || 0} left in stock.`,
        });
      }
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    // ── Handle coupon ─────────────────────────────────────────
    let couponDiscount = 0;
    let appliedCoupon  = null;

    if (couponCode) {
      appliedCoupon = await Coupon.findOne({
        code:     couponCode.toUpperCase(),
        isActive: true,
      });

      if (!appliedCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive coupon code',
        });
      }

      if (new Date() > appliedCoupon.expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has expired',
        });
      }

      if (appliedCoupon.usageCount >= appliedCoupon.maxUsage) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has reached its usage limit',
        });
      }

      if (subtotal < appliedCoupon.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount for this coupon is ₦${appliedCoupon.minOrderAmount.toLocaleString()}`,
        });
      }

      if (appliedCoupon.usedBy.includes(req.user._id)) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this coupon',
        });
      }

      couponDiscount =
        appliedCoupon.discountType === 'percentage'
          ? (subtotal * appliedCoupon.discountValue) / 100
          : appliedCoupon.discountValue;

      couponDiscount = Math.min(couponDiscount, subtotal);
    }

    const totalAmount = subtotal - couponDiscount;

    // Atomic inventory deduction, prevents race condition. if only ONE person gets last item.
    // Throws error if stock runs out between check and deduction
    try {
      await deductInventory(items);
    } catch (stockError) {
      return res.status(400).json({
        success: false,
        message: stockError.message,
      });
    }

    // Create order AFTER successful inventory deduction
    const order = await Order.create({
      customer:       req.user._id,
      items,
      shippingAddress,
      subtotal,
      couponCode:     appliedCoupon ? appliedCoupon.code : null,
      couponDiscount,
      totalAmount,
      paymentMethod:  paymentMethod || 'paystack',
    });

    // Update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usageCount += 1;
      appliedCoupon.usedBy.push(req.user._id);
      await appliedCoupon.save();
    }

    // Respond immediately
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });

    // Send confirmation email in background
    sendTemplateEmail(req.user.email, 'orderConfirmation', {
      name:  req.user.name,
      order,
    }).catch(err => console.error('Order email failed:', err.message));

  } catch (error) {
    next(error);
  }
};

// GET MY ORDERS — customer views their own orders
export const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { customer: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name images')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      page:   Number(page),
      pages:  Math.ceil(total / Number(limit)),
      total,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE ORDER
export const getSingleOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Customer can only see their own orders
    if (
      req.user.role === 'customer' &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// CANCEL ORDER
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Customer can only cancel their own orders
    if (
      req.user.role === 'customer' &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an order that has already shipped or been delivered',
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    // Restore inventory when order is cancelled
    await restoreInventory(order.items);

    order.status             = 'cancelled';
    order.cancelledAt        = new Date();
    order.cancellationReason = reason || null;
    await order.save();

    //Respond immediately
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });

    // Send cancellation email in background
    sendTemplateEmail(order.customer.email, 'orderCancelled', {
      name:  order.customer.name,
      order,
    }).catch(err => console.error('Cancel email failed:', err.message));

  } catch (error) {
    next(error);
  }
};


// GET ALL ORDERS — admin views all orders

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status)        filter.status        = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name email')
        .populate('items.product', 'name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      page:   Number(page),
      pages:  Math.ceil(total / Number(limit)),
      total,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE ORDER STATUS — admin updates order status

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a cancelled order',
      });
    }

    order.status = status;
    await order.save();

    //  Respond immediately
    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
      order,
    });

    // Send status update email in background
    sendTemplateEmail(order.customer.email, 'orderStatusUpdate', {
      name:  order.customer.name,
      order,
    }).catch(err => console.error('Status email failed:', err.message));

  } catch (error) {
    next(error);
  }
};

// SALES ANALYTICS — admin dashboard stats

export const getSalesAnalytics = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Revenue per month — last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:     { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        ordersByStatus,
        revenueByMonth,
      },
    });
  } catch (error) {
    next(error);
  }
};