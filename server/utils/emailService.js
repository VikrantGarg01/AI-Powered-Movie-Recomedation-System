import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let cachedTransporter = null;

/**
 * Creates and configures the Nodemailer SMTP Transporter
 * Sourced securely from environment variables (process.env)
 */
export const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : undefined;

  if (!user || !pass) {
    logger.warn('SMTP credentials (SMTP_USER / SMTP_PASS) not set in environment. Outbound verification emails disabled.');
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'false' ? false : true,
    auth: {
      user,
      pass
    }
  });

  return cachedTransporter;
};

/**
 * Verify SMTP connection on startup or demand
 */
export const verifySmtpConnection = async () => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn('SMTP service skipped: SMTP_USER or SMTP_PASS not configured in environment.');
    return false;
  }
  try {
    await transporter.verify();
    logger.info(`SMTP Service Connected: ready to send verification emails via ${process.env.SMTP_USER}`);
    return true;
  } catch (error) {
    logger.error(`SMTP Verification Failed: ${error.message}`);
    return false;
  }
};

/**
 * Send an OTP verification code email to a user
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.code - 6-digit verification code
 * @param {'register' | 'login'} [options.type='register'] - Purpose of verification
 */
export const sendVerificationEmail = async ({ to, name, code, type = 'register' }) => {
  const fromName = process.env.SMTP_FROM_NAME || 'Movie+ Security';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'adminrecallc@gmail.com';

  const isRegistration = type === 'register';
  const actionTitle = isRegistration ? 'Complete Your Account Registration' : 'Verify Your Identity';
  const actionSubtitle = isRegistration
    ? 'To ensure user privacy and verify your account authenticity, enter the 6-digit code below to activate your Movie+ profile.'
    : 'A sign-in attempt was detected for your Movie+ account. Use this security code to verify your identity.';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movie+ Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f19;
      padding: 40px 0;
    }
    .main-card {
      max-width: 540px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-subtitle {
      color: #ffe4e6;
      font-size: 13px;
      font-weight: 500;
      margin-top: 6px;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 36px 32px;
      text-align: left;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .otp-box {
      background: #090d16;
      border: 2px dashed #e11d48;
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #38bdf8;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 10px;
      margin: 0;
      padding-left: 10px;
    }
    .expiry-notice {
      background: rgba(225, 29, 72, 0.1);
      border-left: 3px solid #e11d48;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #fca5a5;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #1f2937;
      padding: 20px 32px;
      background: #0d131f;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <div class="header">
        <h1 class="brand-title">🎬 Movie+</h1>
        <p class="brand-subtitle">High-Accuracy Movie Recommendation System</p>
      </div>

      <div class="content">
        <div class="badge">🔒 Privacy & Account Security</div>
        <h2 class="greeting">Hello, ${name || 'Film Enthusiast'}!</h2>
        <p class="message">
          ${actionSubtitle}
        </p>

        <div class="otp-box">
          <div class="otp-label">One-Time Verification Code</div>
          <div class="otp-code">${code}</div>
        </div>

        <div class="expiry-notice">
          ⏱️ <strong>Security Notice:</strong> This code is valid for <strong>10 minutes</strong>. Never share this code with anyone. Movie+ staff will never ask for your verification code.
        </div>

        <p class="message" style="margin-bottom: 0; font-size: 12px; color: #64748b;">
          If you did not request this email or account registration, please disregard it safely.
        </p>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px 0;"><strong>Movie+ Recommendation Engine & Identity Guard</strong></p>
        <p style="margin: 0;">Automated notification sent via Gmail SMTP secure relay (${fromEmail}).</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
🎬 Movie+ — ${actionTitle}
Hello ${name || 'User'},

Your one-time verification code is: ${code}

This code expires in 10 minutes.
If you did not request this verification code, please ignore this email.

— Movie+ Security System
  `.trim();

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `🔐 Movie+ Security Code: ${code}`,
    text,
    html
  };

  const transporter = getTransporter();
  if (!transporter) {
    logger.warn(`Skipping verification email to ${to}: SMTP transporter not configured.`);
    return { success: false, message: 'SMTP not configured' };
  }

  const info = await transporter.sendMail(mailOptions);
  logger.info(`Verification email sent to ${to}. MessageId: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};

export default {
  verifySmtpConnection,
  sendVerificationEmail
};
