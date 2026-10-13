import nodemailer, { Transporter } from 'nodemailer';
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
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
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

  const mailOptions = {
    from: 'Filmvisarna Cinema',
    to: bookingData.email,
    subject: `Booking Confirmation - ${bookingData.movieTitle} (${bookingData.bookingRef})`,
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