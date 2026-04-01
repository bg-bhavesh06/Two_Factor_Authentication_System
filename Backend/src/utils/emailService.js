const nodemailer = require("nodemailer");

function getTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: EMAIL_SECURE === "true",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

async function sendOtpEmail({ to, username, otp }) {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error("Email service is not configured.");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Your One-Time Password for Secure Login",
    html: `
      <div style="font-family: Arial, sans-serif; color: #17324d; line-height: 1.6;">
        <h2 style="color: #2e8fd3;">Advanced 2FA Security Verification</h2>
        <p>Hello ${username || "User"},</p>
        <p>Your one-time password for secure login is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2e8fd3; margin: 18px 0;">
          ${otp}
        </div>
        <p>This OTP is linked to your current login session and device.</p>
        <p>It will expire automatically in 10 minutes.</p>
        <p>If you did not try to sign in, please ignore this email.</p>
      </div>
    `
  });
}

module.exports = { sendOtpEmail };
