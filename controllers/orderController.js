import { Order} from '../models/orderModel.js';

import {Inventory} from '../models/inventoryModel.js';

import {Coupon} from '../models/couponModel.js';

import {User} from '../models/userModel.js';

import { sendTemplateEmail } from '../utils/sendEmail.js';
import { Product } from '../models/productModel.js';


// internal: deduct inventory
const deductInventory = async(items) => {
  for(const item of items) {
    const record = await Inventory.findOne({product: item.product});

    if(!record || record.quantity < item.quantity) {
      throw new Error(`Insufficient stock for: ${item.name}`);
    }
    record.quantity -= item.quantity;
    await record.save();
  }
};

// Internal : restore inventory (on cancellation)
const restoreInventory = async (items) => {
  for(const item of items) {
    await Inventory.findOneAndUpdate({
      product: item.product},
      {$inc: {quantity: item.quantity } }
    );
  }
};

// Place order
export const placeOrder = async (req, res, next) => {
  try{
    const {items, shippingAddress, couponCode, paymentMethod } = req.body;

    if(!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item'
      });
    }
    //Guard: Seller cannot order thir own products
    for (const item of items) {
      const product = await Product.findById(item.product).select('seller');
      if(product && product.seller.toString()=== req.user._id.toString()) {
        return res.status(403).json({
          success:false,
          message:`You cannot purchase your own product: "${item.name}"`,
        });
      }
    }

    //GUARD: re-validate item price against our current product prices
    const priceChangedItems = [];

    for(const item of items) {
      const product = await Product.findById(item.product).select('basePrice discountPercentage status name');

      if(!product || product.status !=='active') {
        return res.status(400).json({
          success:false,
          message:`"${item.name}" is no longer available`,
        });
      }

      //calculate current effective price (apply discount if set)
      const currentPrice =
      product.discountPercentage >0
      ? product.basePrice * (1- product.discountPercentage/100)
      : product.basePrice;

      const priceDiff = Math.abs(currentPrice - item.price);
      //allow a small floating-point tolerance(1 kobo)
      if(priceDiff >0.01) {
        priceChangedItems.push({
          name: item.name,
          oldprice: item.price,
          newPrice:Number(currentPrice.toFixed(2)),
        });
      }
    }

    if(priceChangedItems.length >0) {
      return res.status(409).json({
        success:false,
        message:'Some item prices have changed since you added them to your cart. Please review your cart.',
        priceChangedItems,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    //handle coupon
    let couponDiscount = 0;
    let appliedCoupon = null;

    if(couponCode) {
      appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true});

      if(appliedCoupon && new Date() < appliedCoupon.expiresAt && appliedCoupon.usageCount < appliedCoupon.maxUsage && subtotal >= appliedCoupon.minOrderAmount && !appliedCoupon.usedBy.includes(req.user._id)
){
  couponDiscount = appliedCoupon.discountType === 'percentage'
  ?(subtotal * appliedCoupon.discountValue) / 100 : appliedCoupon.discountValue;

couponDiscount = Math.min(couponDiscount, subtotal);
  }
}

const totalAmount = subtotal - couponDiscount;


// Deduct inventory (throws if stock is insufficient)

await deductInventory(items);

// create order
const order = await Order.create({
  customer: req.user._id,
  items,
  shippingAddress,
  subtotal,
  couponCode:  appliedCoupon ? appliedCoupon.code : null,
  couponDiscount,
  totalAmount,
  paymentMethod: paymentMethod || 'paystack',
});

//update coupon usage
if(appliedCoupon){
  appliedCoupon.usageCount += 1;
  appliedCoupon.usedBy.push(req.user._id);
  await appliedCoupon.save();
}


// send confirmation email

await sendTemplateEmail(req.user.email, 'orderConfirmation', {
  name: req.user.name,
  order,
});

return res.status(201).json({
  success: true,
  message: 'Order placed successfully',
  order,
  });
} catch (error) {
  next(error);
  }
};

//get my orders (customer)
export const getMyOrders = async (req, res, next) => {
  try{
    const {status, page = 1, limit =10 } = req.query;
    const filter = { customer: req.user._id };
    if(status) filter.status =status;

    const skip = (page -1) * limit;
    const orders = await Order.find(filter)
      .populate('items.product', 'name images')
      .skip(skip)
      .limit(Number(limit))
      .sort({createdAt: -1});

const total = await Order.countDocuments(filter);

return res.json({
  success: true,
  page: Number(page),
  totalPage: Math.ceil(total / limit),
  total,
  orders,
  });
} catch (error) {
  next(error);
  }
};

// get single order

export const getSingleOrder = async (req, res, next) => {
  try{
    const order = await Order.findById(req.params._id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images');

  if(!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
      }

      //Customer can only see their own orders
      if(req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()
      ){
    return res.status(403).json({
      success: false, 
      message: 'Access denied'
    });
      }

      return res.json({
        success: true, order
      });
      } catch (error){
        next(error);
      }
  
};


//get all orders by admin

export const getAllOrders = async (req, res, next) =>  {
  try{
    const { status, paymentStatus, page = 1, limit = 20 }= req.query;
    const filter = {};
    if(status)    filter.status   = status;
    if(paymentStatus)  filter.paymentStatus = paymentStatus;

const skip = (page - 1) * limit;
const orders = await Order.find(filter)
    .populate('customer', 'name email')
    .populate('items.product', 'name')
    .skip(skip)
    .limit(Number(limit))
    .sort({createdAt: -1 });

const total = await Order.countDocuments(filter);

return res.json({
  success: true,
  page: Number(page),
  totalPages: Math.ceil(total / limit),
  total,
  orders,
  });
} catch (error) {
  next(error);
  }
};


//update order status by admin

export const updateOrderStatus = async (req, res, next) => {
  try{
    const {status} = req.body;

    const order = await Order.findById(req.params._id).populate('customer', 'name email');
    if(!order){
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
   }


   if(order.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a cancelled order'
    });
   }

   order.status = status;
   await order.save();


   //notify customer
   await sendTemplateEmail(order.customer.email, 'orderStatusUpdate',{
    name: order.customer.name,
    order,
   });

   return res.json({
    success: true,
    message: `Order status updated to "${status}"`,
    order,
   });
  } catch (error){
    next(error);
  }
};


//cancel order

export  const cancelOrder = async (req, res, next) => {
  try{
    const {reason} = req.body;

    const order = await Order.findById(req.params._id).populate('customer', 'name email');
    if(!order){
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // customer can only cancel their own order

  if(
    req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()
  ){
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if(['shipped', 'delivered'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel an order that has already shipped or been delivered',
    });
  }

  if(order.status === 'cancelled') {
    return res.status(400).json({
      success:false,
      message:'This order is already cancelled',
    });
  }

  //restore stock
  await restoreInventory(order.items);

  order.status  ='cancelled';
  order.cancelledAt  = new Date();
  order.cancellationReason  = reason || null;

  // if order was already paid, flag it for admin refund
  if(order.paymentStatus === 'paid') {
    order.paymentStatus = 'refund_pending';  //signals admin to process refund
  }

  await order.save();

  await sendTemplateEmail(order.customer.email, 'orderCancelled',{
    name: order.customer.name,
    order,
  });

  return res.json({
    success: true,
    message: order.paymentStatus === 'refund_pending'
    ? 'Order cancelled. Since you already paid, a refund will be processed by our team shortly.'
    : 'Order cancelled successfully',
    order,
  });
  } catch (error) {
    next(error);
  }
};



// Sale analytics (admin dashboard)

export const getSaleAnalytics = async (req, res, next) => {
  try{
    const totalOrders = await Order.countDocuments();

    const revenueResult = await Order.aggregate([
      {$match: {paymentStatus: 'paid' }},
      {$group: {_id: null, total: {$sum: '$totalAmount'}}},
    ]);
const totalRevenue = revenueResult[0]?.total || 0;

const orderByStatus = await Order.aggregate([
  {$group: {_id: '$status', count: {$sum: 1 }}},
]);


//Revenue per month-6months

const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() -6);

const revenueByMonth = await Order.aggregate([
  {$match: { paymentStatus: 'paid', createdAt: {$gte: sixMonthsAgo }}},
  {
    $group: {
      _id: { year: {$year: '$createdAt'}, month: {$month: '$createdAt'}},
      revenue: {$sum: '$totalAmount'},
      orders: {$sum: 1},
    },
  },
  {$sort: {'_id.year': 1, '_id.month': 1 }},
]);

return res.json({
  success: true,
  data: {
    totalOrders,
    totalRevenue,
    orderByStatus,
    revenueByMonth,
  },
});
  } catch (error) {
    next(error);
  }
};