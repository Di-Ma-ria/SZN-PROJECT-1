import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },

    discountValue:  {
      type: Number,
      required: true,
      min: [1, 'Discount must be at least 1']
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },

    maxUsage:  {
      type: Number,
      default: 100
    },

    usageCount:  {
      type: Number,
      default: 0
    },

    expiresAt:  {
      type: Date,
      required: [true, 'Expiry date is required ']
    },
    isActive:  {
      type: Boolean,
      default: true
    },

    //Tracks who used this coupon - prevents a user from using it twice

    usedBy: [{
      type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
  },
  {timestamps: true}
);

export const Coupon = mongoose.model('Coupon', couponSchema);