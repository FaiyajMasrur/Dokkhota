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
  const message = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  const isProduction = process.env.NODE_ENV === 'production';

  if (disableEmail || !transporter) {
    const logReason = disableEmail ? 'disabled' : 'SMTP transport not configured';
    console.warn(`Email delivery is ${logReason}. Falling back to console preview.`);
    console.log('=== Dokkhota Email Preview ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('==============================');
    return { success: true, preview: true };
  }

  try {
    return await transporter.sendMail(message);
  } catch (error) {
    console.error('Email send failed:', error.message);
    if (!isProduction) {
      console.warn('Falling back to console preview because email sending failed in a non-production environment.');
      console.log('=== Dokkhota Email Preview ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html);
      console.log('==============================');
      return { success: true, preview: true, error: error.message };
    }
    throw error;
  }
};

module.exports = { sendEmail };
