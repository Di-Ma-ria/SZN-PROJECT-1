
import nodemailer from 'nodemailer';

//Base HTML wrapper
const wrap = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
    <div style="background:#1a1a2e;padding:20px;text-align:center;">
      <h2 style="color:#fff;margin:0;">🛍️ LODITOJO</h2>
    </div>
    <div style="padding:28px;background:#fff;">
      ${content}
    </div>
    <div style="padding:12px;text-align:center;font-size:12px;color:#999;background:#f9f9f9;">
      © ${new Date().getFullYear()} LODITOJO. All rights reserved.
    </div>
  </div>
`;

// All email templates
const templates = {

  otp: ({ name, otp, purpose }) => ({
    subject: purpose === 'password-reset'
      ? 'Reset Your Password — LODITOJO'
      : 'Verify Your Email — LODITOJO',
    html: wrap(`
      <h3 style="color:#1a1a2e;">Hello, ${name} 👋</h3>
      <p>${purpose === 'password-reset'
        ? 'You requested to reset your password. Use the OTP below:'
        : 'Thank you for signing up! Verify your email with the OTP below:'
      }</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="font-size:38px;font-weight:bold;letter-spacing:10px;
                     color:#1a1a2e;background:#f0f0f0;
                     padding:14px 28px;border-radius:8px;">
          ${otp}
        </span>
      </div>
      <p style="color:#555;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#999;font-size:13px;">If you did not request this please ignore this email.</p>
    `),
  }),

  welcome: ({ name }) => ({
    subject: 'Welcome to LODITOJO! 🎉',
    html: wrap(`
      <h3 style="color:#1a1a2e;">Welcome, ${name}! 🎉</h3>
      <p>We are excited to have you on board at LODITOJO.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.CLIENT_URL}/shop"
           style="background:#1a1a2e;color:#fff;padding:12px 28px;
                  border-radius:6px;text-decoration:none;font-weight:bold;">
          Start Shopping
        </a>
      </div>
      <p style="color:#999;font-size:13px;">Please verify your email to unlock all features.</p>
    `),
  }),

  orderConfirmation: ({ name, order }) => ({
    subject: `Order Confirmed — #${order._id}`,
    html: wrap(`
      <h3 style="color:#1a1a2e;">Hi ${name}, your order is confirmed! ✅</h3>
      <p>Thank you for shopping with us. Here is your order summary:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:10px;text-align:left;border:1px solid #ddd;">Product</th>
            <th style="padding:10px;text-align:center;border:1px solid #ddd;">Qty</th>
            <th style="padding:10px;text-align:right;border:1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td style="padding:10px;border:1px solid #ddd;">${item.name}</td>
              <td style="padding:10px;text-align:center;border:1px solid #ddd;">${item.quantity}</td>
              <td style="padding:10px;text-align:right;border:1px solid #ddd;">₦${item.price.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><strong>Subtotal:</strong> ₦${order.subtotal.toLocaleString()}</p>
      ${order.couponDiscount > 0
        ? `<p><strong>Coupon Discount:</strong> -₦${order.couponDiscount.toLocaleString()}</p>`
        : ''}
      <h4 style="color:#1a1a2e;">Total: ₦${order.totalAmount.toLocaleString()}</h4>
      <p>We will notify you when your order ships. 🚚</p>
    `),
  }),

  orderStatusUpdate: ({ name, order }) => ({
    subject: `Order Update — #${order._id}`,
    html: wrap(`
      <h3 style="color:#1a1a2e;">Hi ${name},</h3>
      <p>Your order <strong>#${order._id}</strong> status has been updated.</p>
      <div style="text-align:center;margin:24px 0;padding:16px;background:#f5f5f5;border-radius:8px;">
        <p style="margin:0;font-size:12px;color:#999;text-transform:uppercase;">Current Status</p>
        <p style="margin:8px 0 0;font-size:24px;font-weight:bold;
                  color:#1a1a2e;text-transform:capitalize;">${order.status}</p>
      </div>
      <p>Thank you for your patience!</p>
    `),
  }),

  orderCancelled: ({ name, order }) => ({
    subject: `Order #${order._id} Cancelled`,
    html: wrap(`
      <h3 style="color:#1a1a2e;">Hi ${name},</h3>
      <p>Your order <strong>#${order._id}</strong> has been cancelled.</p>
      ${order.cancellationReason
        ? `<p><strong>Reason:</strong> ${order.cancellationReason}</p>`
        : ''}
      <p>If you paid online a refund will be processed within <strong>3-5 business days</strong>.</p>
      <p>Questions? Contact our support team anytime.</p>
    `),
  }),

  accountSuspended: ({ name, reason }) => ({
    subject: 'Your Account Has Been Suspended — LODITOJO',
    html: wrap(`
      <h3 style="color:#c0392b;">Hi ${name},</h3>
      <p>Your LODITOJO account has been suspended for the following reason:</p>
      <blockquote style="border-left:4px solid #c0392b;padding:10px 16px;color:#555;margin:16px 0;">
        ${reason || 'Violation of our terms of service'}
      </blockquote>
      <p>If you believe this is a mistake please contact our support team.</p>
    `),
  }),

  sellerApplicationResult: ({ name, action, reason }) => ({
    subject: `Seller Application ${action === 'approve' ? 'Approved' : 'Rejected'} — LODITOJO`,
    html: wrap(`
      <h3 style="color:#1a1a2e;">Hi ${name},</h3>
      ${action === 'approve'
        ? `<p>🎉 Congratulations! Your seller application has been <strong style="color:green;">approved</strong>. You can now list products on LODITOJO.</p>`
        : `<p>Your seller application has been <strong style="color:red;">rejected</strong>.</p>
           ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
           <p>You may reapply after addressing the issues mentioned above.</p>`
      }
    `),
  }),

  accountDeletion: ({ name, otp }) => ({
    subject: 'Confirm Account Deletion — LODITOJO',
    html: wrap(`
      <h3 style="color:#c0392b;">Hi ${name},</h3>
      <p>We received a request to <strong>permanently delete</strong> your LODITOJO account.</p>
      <p>Use the OTP below to confirm this action:</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="font-size:38px;font-weight:bold;letter-spacing:10px;
                     color:#c0392b;background:#f0f0f0;
                     padding:14px 28px;border-radius:8px;">
          ${otp}
        </span>
      </div>
      <p style="color:#555;">This OTP expires in <strong>10 minutes</strong>.</p>
      <p style="color:#c0392b;font-weight:bold;">
        If you did not request this please change your password immediately.
      </p>
    `),
  }),

};

const createTransporter = () => {

 console.log('=== EMAIL DEBUG ===');
  console.log('HOST:', process.env.EMAIL_HOST);
  console.log('USER:', process.env.EMAIL_USER);
  console.log('PASS:', process.env.EMAIL_PASS ? `${process.env.EMAIL_PASS.substring(0, 10)}...` : 'MISSING');
  console.log('==================');

  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Core send function
export const sendEmail = async ({ to, subject, html }) => {
 try {
  console.log('=== EMAIL DEBUG ===');
    console.log('HOST:', process.env.EMAIL_HOST);
    console.log('USER:', process.env.EMAIL_USER);
    console.log('PASS:', process.env.EMAIL_PASS ? 'loaded' : 'MISSING');
    console.log('==================');



    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('Email failed to send:', error.message);
    console.error('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.error('EMAIL_USER:', process.env.EMAIL_USER);
  }
};

//  Template helper
export const sendTemplateEmail = async (to, templateName, data) => {
  const template = templates[templateName](data);
  await sendEmail({
    to,
    subject: template.subject,
    html:    template.html,
  });
};