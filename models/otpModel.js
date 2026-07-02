import mongoose from 'mongoose';

import bcryptjs from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },

  otp: {
    type: String,
    required: true,
  },

  purpose: {
    type: String,
    enum: ['email-verification', 'password-reset'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: {expires: 0}, // MongoDB auto-deletes expired OTPs
  },

  verified: {
    type: Boolean,
    default: false,
  },
});


//Hash OTP before saving - same security as passwords
otpSchema.pre('save', async function (next){
  if(!this.isModified('otp')) return next();
  this.otp = await bcryptjs.hash(this.otp, 10);
  next();
});

otpSchema.methods.compareOtp = async function (candidateOtp) {
  return await bcryptjs.compare(candidateOtp, this.otp);
};

export const OTP = mongoose.model('OTP', otpSchema);