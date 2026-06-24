import axios from 'axios';

import {Order} from '../models/orderModel.js';

import{User} from '../models/userModel.js';

import {sendTemplateEmail} from '../utils/sendEmail.js';


const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const  paystackHeaders = {Authorization: `Bearer ${PAYSTACK_SECRET}`};

export const initializePayment = async (req, res, next) => {
  try{
    const {orderId} = req.body;

    const order = await Order.findById(orderId).populate('customer', 'name email');
    if(!order){
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    //only the customer who owns this order can pay
    if(order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: 'Access denied'
      });
        }

        if(order.paymentStatus === 'paid'){
          return res.status(400).json({
            success: false,
            message: 'This order has already been paid for'
          });
        }


const response =  await axios.post(
  'https://api.paystack.co/transaction/initialize',
  {
    email:  order.customer.email,
    amount:  Math.round(order.totalAmount * 100), // Paystack uses kobo

    currency:  'NGN',
    reference:  `order_${order._id}_${Date.now()}`,
    metadata: {
      orderId:   order._id.toString(),
      customerId:  req.user._id.toString(),
      customerName: order.customer.name,
    },
    callback_url: `${process.env.ClIENT_URL}/payment/verify`,
  },
  {headers: paystackHeaders}
);


const {authorization_url, reference, access_code } = response.data.data;

return res.json({
  success: true,
  message: 'Payment initialized',
  data:{
    paymentUrl: authorization_url, // redirect customer to this URL
    reference,
    accessCode:  access_code,
    orderId: order.id,
    amount: order.totalAmount,
    },
  }); 
} catch (error) {
  next(error);
  }
};



// verify payment 
//Called after Paystack redirects the customer back to your app
export const verifyPayment = async (req, res, next ) => {
  try{
    const {reference} = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {headers: paystackHeaders}
    );

    const {status, metadata} = response.data.data;

    if(status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment was not successful',
        paystackStatus: status,
      });
    }
const order = await Order.findById(metadata.orderId).populate('customer', 'name email');
if(!order) {
  return res.status(404).json({
    success: false, 
    message: 'Order not found'
  });
} 

if(order.paymentStatus == 'paid') {
  return res.json({
    success: true, 
    message: 'Payment already verified', order
  });
}

// MArk order as paid
order.paymentStatus   ='paid';
order.paymentReference  = reference;
order.paidAt  = new Date();
order.status    = 'confirmed';
await order.save();

//update customer stats from your User model
await User.findByIdAndUpdate(order.customer._id, {
  $inc: { totalOrder: 1, totalSpent: order.totalAmount},
});

// send payment confirmation email
await sendTemplateEmail(order.customer.email, 'orderConfirmation', {
  name: order.customer.name,
  order,
});

return res.json({
  success: true,
  message: 'Payment verified. Order confirmed!',
  order,
});
} catch(error) {
  next (error);
 }
};


// paystack webhook

/*Paystack calls this automatically -morre reliable then verify. Add this URL in your paystack dashboard => settings => webhooks*/

export const paystackWebhook = async (req, res, next ) => {
  try{
    const crypto = await import('crypto');
    const hash = crypto.default
      .createHmac('sha%12', PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

if (hash !==req.headers['x-paystack-signature']) {
  return res.status(401).json({
    success: false,
    message: 'Invalid webhook signature'
  });
}

const {event, data} = req.body;

if(event === 'charge.success') {
  const {reference, metadata} = data;

  const order = await Order.findById(metadata.orderId).populate('customer', 'name email');


  if(order && order.paymentStatus !== 'paid') {
    order.paymentStatus  = 'paid';
    order.paymentReference = reference;
    order.paidAt  = new Date();
    order.status  = 'confirmed';
    await order.save();

    await User.findByIdAndUpdate(order.customer._id, {
      $inc: { totalOrders: 1, totalSpent: order.totalAmount},
    });

    await sendTemplateEmail(order.customer.email, 'orderConfirmation', {
      name: order.customer.name,
      order,
    });
    }
}

// always return 200 so paystack stops retrying
return res.sendStatus(200);
  } catch (error){
    next(error);
  }
};


// get payment history (admin)

export const getPaymentHistory = async (req, res, next) => {
  try{
    const { page = 1, limit =20} = req.query;
    const skip = (page - 1) * limit;

    const payments = await Order.find({paymentStatus: 'paid'})
      .populate('customer', 'name email')
      .select('customer totalAmount paymentReference paymentMethod paidAt status')
      .skip(skip)
      .limit(Number(limit))
      .sort({paidAt: -1});

  const total = await Order.countDocuments({ paymentStatus: 'paid'});

return res.json({
  success: true,
  page: Number(page),
  totalPages: Math.ceil(total / limit),
  total,
  payments,
});
  } catch (error){
    next(error);
  }
};