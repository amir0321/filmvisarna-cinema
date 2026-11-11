import nodemailer, { Transporter } from 'nodemailer';
import type { AuthEmail } from './authActions.service.js';
import type { GuestBookingEmail } from './guestBookings.service.js';
import {
  generateBookingConfirmationHtml,
  generateBookingConfirmationText,
  EmailPayload,
  TicketInfo,
  KioskItemInfo,
} from '../templates/bookingConfirmationTemplate.js';

export type { EmailPayload, TicketInfo, KioskItemInfo };

// Transporter & SMTP Configuration

let cachedTransporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  ) {
    const port = Number(process.env.EMAIL_PORT);
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    console.log("No SMTP settings found. Creating Ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return cachedTransporter;
}

// Email Dispatch Service

export async function sendBookingConfirmation(bookingData: EmailPayload) {
  const transporter = await getTransporter();

  const htmlContent = generateBookingConfirmationHtml(bookingData);
  const textContent = generateBookingConfirmationText(bookingData);

  const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@filmvisarna.se';
  const mailOptions = {
    from: `"Filmvisarna Cinema" <${senderEmail}>`,
    to: bookingData.email,
    subject: `Bokningsbekräftelse - ${bookingData.movieTitle} (${bookingData.bookingRef})`,
    text: textContent,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("Email sent: %s", info.messageId);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("Preview email: %s", previewUrl);
  }

  return info;
}

export function isAuthEmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

export async function sendAuthEmail(data: AuthEmail): Promise<void> {
  // Auth messages must reach a real inbox; never silently fall back to Ethereal.
  if (!isAuthEmailConfigured()) throw new Error('Auth SMTP is not configured');
  const transporter = await getTransporter();
  const resetting = data.purpose === 'reset_password';
  const title = resetting ? 'Återställ ditt lösenord' : 'Verifiera din e-postadress';
  const description = resetting
    ? 'Du har begärt att återställa lösenordet till ditt konto hos Filmvisarna.'
    : 'Välkommen till Filmvisarna! Bekräfta att den här e-postadressen tillhör dig.';
  const expiry = resetting ? '30 minuter' : '24 timmar';
  const escapedUrl = data.url.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  const info = await transporter.sendMail({
    from: { name: 'Filmvisarna Cinema', address: process.env.EMAIL_FROM || process.env.EMAIL_USER! },
    to: { address: data.email, name: '' },
    subject: `${title} – Filmvisarna`,
    text: `${description}\n\n${title}: ${data.url}\n\nLänken gäller i ${expiry} och kan bara användas en gång. Om du inte begärde detta kan du bortse från mejlet.`,
    html: `<html lang="sv"><body><h1>${title}</h1><p>${description}</p><p><a href="${escapedUrl}">${title}</a></p><p>Länken gäller i ${expiry} och kan bara användas en gång.</p><p>Om du inte begärde detta kan du bortse från mejlet.</p><p>Filmvisarna Cinema</p></body></html>`,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  if (info.rejected?.length) throw new Error('Auth email rejected');
}

export async function sendGuestBookingEmail(data: GuestBookingEmail): Promise<void> {
  if (!isAuthEmailConfigured()) throw new Error('Booking verification SMTP is not configured');
  const transporter = await getTransporter();
  const escapedUrl = data.url.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  const description = `Bekräfta din gästbokning hos Filmvisarna inom ${data.expiresInMinutes} minuter. Platserna reserveras först när du har bekräftat bokningen. Du betalar i kassan.`;
  const info = await transporter.sendMail({
    from: { name: 'Filmvisarna Cinema', address: process.env.EMAIL_FROM || process.env.EMAIL_USER! },
    to: { address: data.email, name: '' }, subject: 'Bekräfta din gästbokning – Filmvisarna',
    text: `${description}\n\nÖppna bokningen: ${data.url}\n\nKlicka på Bekräfta bokning på sidan. Om du inte begärde detta kan du bortse från mejlet.`,
    html: `<html lang="sv"><body><h1>Bekräfta din gästbokning</h1><p>${description}</p><p><a href="${escapedUrl}">Öppna bokningen</a></p><p>Klicka på Bekräfta bokning på sidan. Om du inte begärde detta kan du bortse från mejlet.</p></body></html>`,
    disableFileAccess: true, disableUrlAccess: true,
  });
  if (info.rejected?.length) throw new Error('Booking verification email rejected');
}
