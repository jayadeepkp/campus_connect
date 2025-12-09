// server/utils/mailer.js
import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  console.warn(' SMTP is not fully configured. Password reset emails may fail.');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.gmail.com',
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_SECURE === 'true' ? true : false, // false for TLS (STARTTLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Send an email using the shared transporter.
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!to) throw new Error('sendEmail: "to" is required');
  if (!subject) throw new Error('sendEmail: "subject" is required');

  const from = MAIL_FROM || SMTP_USER;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  console.log(`Email sent to ${to}: ${info.messageId}`);
  return info;
}