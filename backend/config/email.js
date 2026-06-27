// Nodemailer configuration for Dokkhota email sending
const nodemailer = require('nodemailer');

let transporter = null;
const disableEmail = process.env.DISABLE_EMAIL === 'true' || process.env.DISABLE_EMAIL === '1';

if (!disableEmail) {
  const hasSmtpHost = Boolean(process.env.EMAIL_HOST && process.env.EMAIL_HOST.trim());
  const hasGmailAuth = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  if (hasSmtpHost) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else if (hasGmailAuth) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    console.warn('Real email delivery is enabled but SMTP credentials are missing. Set EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS or use Gmail credentials.');
  }
} else {
  console.warn('EMAIL delivery is disabled. Email notifications will be logged to the console.');
}

const sendEmail = async (to, subject, html) => {
  if (disableEmail) {
    console.log('=== Dokkhota Email Preview ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('==============================');
    return { success: true, preview: true };
  }

  if (!transporter) {
    const error = new Error('Email delivery is enabled but SMTP transport is not configured.');
    console.error(error.message);
    throw error;
  }

  const message = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  };
  return transporter.sendMail(message);
};

module.exports = { sendEmail };
