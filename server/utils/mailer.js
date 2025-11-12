import nodemailer from 'nodemailer';

let transporter;

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP not fully configured. Emails will not send. OTP will be logged to console.');
    // create a “stub” that pretends to send
    transporter = {
      sendMail: async (opts) => {
        console.log('📧 [DEV/STUB] Would send email:', {
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html
        });
        return { messageId: 'dev-stub' };
      }
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || 'no-reply@example.com';
  const t = getTransporter();
  const info = await t.sendMail({ from, to, subject, text, html });
  console.log('📨 Email dispatched:', info.messageId);
  return info;
}