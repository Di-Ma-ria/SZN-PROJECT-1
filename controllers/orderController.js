import { Order} from '../models/orderModel.js';

import {Inventory} from '../models/inventoryModel.js';

import {Coupon} from '../models/couponModel.js';

import {User} from '../models/userModel.js';

import { sendTemplateEmail } from '../utils/sendEmail.js';


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
    const order = await Order.findById(req.params.id)
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

    const order = await Order.findById(req.params.id).populate('customer', 'name email');
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

    const order = await Order.findById(req.params.id).populate('customer', 'name email');
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

  //restore stock
  await restoreInventory(order.items);

  order.status  ='cancelled';
  order.cancelledAt  = new Date();
  order.cancellationReason  = reason || null;
  await order.save();

  await sendTemplateEmail(order.customer.email, 'orderCancelled',{
    name: order.customer.name,
    order,
  });

  return res.json({
    success: true,
    message: 'Order cancelled successfully', order
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