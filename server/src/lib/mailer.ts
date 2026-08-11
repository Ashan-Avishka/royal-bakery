import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends an email. Never throws or rejects -- any failure (SMTP connection,
 * auth, malformed recipient) is caught and logged. Every call site can call
 * this without its own try/catch and without awaiting, so SMTP latency or
 * failure never blocks or breaks the request that triggered it.
 */
export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const from = env.SMTP_FROM_EMAIL || env.SMTP_USER;
  try {
    await getTransporter().sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  } catch (err) {
    console.error(`Failed to send email to ${params.to}`, err);
  }
}
