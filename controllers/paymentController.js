
import axios        from 'axios';

import { Order }    from '../models/orderModel.js';

import { User }     from '../models/userModel.js';

import { sendTemplateEmail } from '../utils/sendEmail.js';

// INITIALIZE PAYMENT

export const initializePayment = async (req, res, next) => {
  try {
    
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    const { orderId } = req.body;

    const order = await Order.findById(orderId)
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Only the customer who owns this order can pay
    if (order.customer.id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid for',
      });
    }

//checks if payment already initialized and prevent multiple paystack charges.

    if(order.paymentReference && order.paymentStatus ==='unpaid') {

//verify if the existing reference is still valid on paystack.
      try{
        const existingResponse = await axios.get(
          `https://api.paystack.co/transaction/verify/${order.paymentReference}`,
{headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`}}
        );
        const existingStatus = existingResponse.data.data.status;

        //if payment i spending or processing return existing link
        if(existingStatus === 'pending' || existingStatus == 'ongoing') {
          return res.status(200).json ({
            success: true,
            message: 'Payment already initialized. Please complete your existing payment.',
            data: {
              reference: order.paymentReference,
              paymentUrl: `https://checkout.paystack.com/${order.paymentReference}`,
              orderId: order._id,
            amount: order.totalAmount,
          },
        });
        }

//If previous payment failed or abandoned allow new initialization to fall through to create new payment.

} catch (verifyError){
  console.log('Previous reference invalid, creating new payment');
}
    }

 // generate a fixed reference based on orderId only and not Date.now()

 const reference = `order_${order._id}`;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email:     order.customer.email,
        amount:    Math.round(order.totalAmount * 100), // Paystack uses kobo
        currency:  'NGN',
        reference,
        metadata: {
          orderId:      order.id.toString(),
          customerId:   req.user.id.toString(),
          customerName: order.customer.name,
        },
        callback_url: `${process.env.CLIENT_URL}/payment/verify`,
      },
      {
        //uses local PAYSTACK_SECRET variable
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const { authorization_url, access_code } = response.data.data;

    // saves reference to order
    await Order.findByIdAndUpdate(orderId, {
      paymentReference: reference,
      paymentInitializedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Payment initialized',
      data: {
        paymentUrl:  authorization_url,
        reference,
        accessCode:  access_code,
        orderId:     order._id,
        amount:      order.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};


// VERIFY PAYMENT

export const verifyPayment = async (req, res, next) => {
  try {

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const { status, metadata } = response.data.data;

    if (status !== 'success') {
      return res.status(400).json({
        success:        false,
        message:        'Payment was not successful',
        paystackStatus: status,
      });
    }

    const order = await Order.findById(metadata.orderId)
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Already verified — return early
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        order,
      });
    }

    //  Mark order as paid 
    order.paymentStatus    = 'paid';
    order.paymentReference = reference;
    order.paidAt           = new Date();
    order.status           = 'confirmed';
    await order.save();

    //  Update customer totalOrders and totalSpent 
    await User.findByIdAndUpdate(order.customer.id, {
      $inc: {
        totalOrders: 1,
        totalSpent:  order.totalAmount,
      },
    });

    // Send confirmation email 
    await sendTemplateEmail(order.customer.email, 'orderConfirmation', {
      name:  order.customer.name,
      order,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified. Order confirmed!',
      order,
    });
  } catch (error) {
    next(error);
  }
};


// PAYSTACK WEBHOOK
// Paystack calls this automatically after payment 

export const paystackWebhook = async (req, res, next) => {
  try {
    // 
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    const crypto = await import('crypto');
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
  .update(req.body) // req.body is already the raw Buffer — use it as-is
  .digest('hex');

if (hash !== req.headers['x-paystack-signature']) { 
   return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
      });
}

// only parse it into JSON *after* the signature check passes
const { event, data } = JSON.parse(req.body);

    // Only handle successful payments
    if (event === 'charge.success') {
      const { reference, metadata } = data;

      const order = await Order.findById(metadata.orderId)
        .populate('customer', 'name email');

      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus    = 'paid';
        order.paymentReference = reference;
        order.paidAt           = new Date();
        order.status           = 'confirmed';
        await order.save();

        // Update customer stats
        await User.findByIdAndUpdate(order.customer.id, {
          $inc: {
            totalOrders: 1,
            totalSpent:  order.totalAmount,
          },
        });

        // Send confirmation email
        await sendTemplateEmail(order.customer.email, 'orderConfirmation', {
          name:  order.customer.name,
          order,
        });
      }
    }

    // Always return 200 so Paystack stops retrying
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};


// REFUND PAYMENT

export const refundPayment = async (req, res, next) => {
  try {
    
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    const { orderId, reason } = req.body;

    const order = await Order.findById(orderId)
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has not been paid for',
      });
    }

    if (order.paymentStatus === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been refunded',
      });
    }

    // Initiate refund on Paystack

    const response = await axios.post(
      'https://api.paystack.co/refund',
      {
        transaction: order.paymentReference,
        merchant_note: reason || 'Refund requested',
      },
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    if (response.data.status) {
      // Update order payment status
      order.paymentStatus = 'refunded';
      await order.save();

      // Send refund email to customer
      await sendTemplateEmail(order.customer.email, 'orderCancelled', {
        name:  order.customer.name,
        order,
      });

      return res.status(200).json({
        success: true,
        message: 'Refund initiated successfully',
        data:    response.data.data,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Refund failed. Please try again.',
    });
  } catch (error) {
    next(error);
  }
};

// GET PAYMENT HISTORY

export const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Order.find({ paymentStatus: { $in: ['paid', 'refunded'] } })
        .populate('customer', 'name email')
        .select('customer totalAmount paymentReference paymentMethod paidAt status paymentStatus')
        .skip(skip)
        .limit(Number(limit))
        .sort({ paidAt: -1 }),
      Order.countDocuments({ paymentStatus: { $in: ['paid', 'refunded'] } }),
    ]);

    return res.status(200).json({
      success: true,
      page:   Number(page),
      pages:  Math.ceil(total / Number(limit)),
      total,
      payments,
    });
  } catch (error) {
    next(error);
  }
};