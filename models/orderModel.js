import mongoose from 'mongoose';


/* each item stores a snapshot of name + price at time of order so old orders are not affected if product price changes later*/

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', 
    required: true
  },

  name:  {
      type: String,
      required: true
      },
  price:  {
      type: Number,
      required: true
      },
  quantity: {
      type: Number,
      required: true,
      min: 1
      },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    items: [orderItemSchema],

    shippingAddress: {
      street: {
        type: String,
        required: true
        
      },
      city:  {
        type: String,
        required: true
      },

      state: {
        type: String,
        required: true
      },

      country:  {
        type: String,
        required: true
      },
    },

    //princing breakdown

    subtotal: {
      type: Number,
      required: true
    },
    couponCode: {
      type: String,
      default: null
    },

    couponDiscount: {
      type: Number,
      default: 0
    },

    totalAmount: {
      type: Number,
      required: true
    }, // subtotal -discount


    // Order lifecycle

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },


    //Payment
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
     },

    paymentMethod: {
      type: String,
      enum: ['paystack', 'cod'],
      default: 'paystack'
    },

    paymentReference: {
      type: String,
      default: null
    },

    paidAt:  {
      type: Date, 
      default: null
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    cancellationReason: {
      type: String,
      default: null
    },
  },
    { timestamps: true }

);

export const Order = mongoose.model('Order', orderSchema);