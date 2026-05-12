import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[EMAIL - skipped, no API key] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: env.RESEND_FROM_EMAIL, to, subject, html });
  } catch (err) {
    console.error('Email send error:', err);
  }
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  await sendEmail(
    to,
    'Welcome to the Mr. Wilson Platform',
    `<h1>Welcome, ${firstName}!</h1><p>Your account has been created. Start exploring masterclasses today.</p>`
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${env.FRONTEND_URLS.split(',')[0]}/reset-password?token=${token}`;
  await sendEmail(
    to,
    'Reset your password',
    `<h1>Password Reset</h1><p>Click the link below to reset your password. This link expires in 1 hour.</p><a href="${resetUrl}">${resetUrl}</a>`
  );
}

export async function sendPaymentReceiptEmail(to: string, firstName: string, masterclassTitle: string, amountCents: number) {
  const amount = (amountCents / 100).toFixed(2);
  await sendEmail(
    to,
    `Payment confirmed - ${masterclassTitle}`,
    `<h1>Payment Confirmed</h1><p>Hi ${firstName}, your payment of $${amount} for <strong>${masterclassTitle}</strong> was successful. You now have full access.</p>`
  );
}

export async function sendInquiryNotificationEmail(senderName: string, senderEmail: string, message: string) {
  await sendEmail(
    env.ADMIN_EMAIL,
    `New inquiry from ${senderName}`,
    `<h1>New Inquiry</h1><p><strong>From:</strong> ${senderName} (${senderEmail})</p><p><strong>Message:</strong></p><p>${message}</p>`
  );
}

export async function sendInquiryReplyEmail(to: string, senderName: string, replyText: string) {
  await sendEmail(
    to,
    'Reply from Joseph Wilson',
    `<h1>Hi ${senderName},</h1><p>${replyText}</p><p>— Joseph Wilson</p>`
  );
}

export async function sendQuoteNotificationEmail(clientName: string, clientEmail: string, serviceTitle: string) {
  await sendEmail(
    env.ADMIN_EMAIL,
    `New quote request from ${clientName}`,
    `<h1>New Quote Request</h1><p><strong>Client:</strong> ${clientName} (${clientEmail})</p><p><strong>Service:</strong> ${serviceTitle}</p>`
  );
}