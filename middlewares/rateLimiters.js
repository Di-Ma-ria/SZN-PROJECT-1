import { rateLimit } from 'express-rate-limit';

// LOGIN — tight limit, this is the classic brute-force target
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: {
    success: false,
    message: 'Too many login attempts. Try again in 15 minutes',
  },
});

// OTP send / resend / forgot-password — these trigger an email send each time, so the limit protects both against brute-forcing OTPs and against spamming a user's inbox / burning through the daily email quota.
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 4,
  message: {
    success: false,
    message: 'Too many requests. Please wait before requesting another code.',
  },
});

// REGISTER — looser than login, real signup bursts (e.g. a class testing the app) shouldn't get blocked, but still capped to slow down bot signups
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Too many accounts created from this address. Try again later.',
  },
});