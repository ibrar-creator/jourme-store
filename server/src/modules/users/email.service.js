import nodemailer from "nodemailer";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    const error = new Error("Email delivery is not configured.");
    error.statusCode = 503;
    throw error;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    requireTLS: Number(SMTP_PORT) !== 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function getClientUrl() {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return clientUrl.replace(/\/+$/, "");
}

function getAccountPath(role) {
  if (role === "seller") return "/seller";
  if (role === "admin") return "/admin";
  return "/account";
}

async function sendAccountEmail({ to, subject, title, message, action, label }) {
  const from = process.env.MAIL_FROM;

  if (!from) {
    const error = new Error("MAIL_FROM must be configured for account emails.");
    error.statusCode = 503;
    throw error;
  }

  const transport = getTransport();
  const text = `${title}\n\n${message}\n\n${label}: ${action}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:560px;margin:32px auto">
      <h1 style="font-size:24px">${title}</h1>
      <p>${message}</p>
      <p><a href="${action}" style="display:inline-block;background:#171717;color:#fff;padding:12px 20px;text-decoration:none">${label}</a></p>
      <p style="font-size:13px;color:#666">If you did not request this, you can ignore this email.</p>
    </div>`;

  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
  }).catch((error) => {
    console.error("Account email delivery failed:", error.message);
    const deliveryError = new Error(
      "Email delivery failed. Check the SMTP settings and server logs."
    );
    deliveryError.statusCode = 503;
    throw deliveryError;
  });
}

export async function sendVerificationEmail(email, token, role) {
  const action = `${getClientUrl()}${getAccountPath(role)}?verify=${encodeURIComponent(token)}`;
  return sendAccountEmail({
    to: email,
    subject: "Verify your Jourme account",
    title: "Verify your email",
    message: "Confirm this email address to activate your Jourme account.",
    action,
    label: "Verify email",
  });
}

export async function sendPasswordResetEmail(email, token, role) {
  const action = `${getClientUrl()}${getAccountPath(role)}?reset=${encodeURIComponent(token)}`;
  return sendAccountEmail({
    to: email,
    subject: "Reset your Jourme password",
    title: "Reset your password",
    message: "Use this one-time link to set a new password. It expires in 30 minutes.",
    action,
    label: "Reset password",
  });
}

export function getClientOrigin() {
  return new URL(getClientUrl()).origin;
}
