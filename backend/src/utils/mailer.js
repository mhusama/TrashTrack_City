import nodemailer from "nodemailer";

let transporter;

export function smtpEnv() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim().replace(/\s+/g, "");
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;
  const from = process.env.SMTP_FROM?.trim() || user;

  return { host, user, pass, port, secure, from };
}

export function isSmtpConfigured() {
  const { host, user, pass } = smtpEnv();
  return Boolean(host && user && pass);
}

export function logSmtpStatus() {
  const { host, user, from } = smtpEnv();
  if (!isSmtpConfigured()) {
    console.warn(
      "[mailer] SMTP NOT configured — emails will not send.\n" +
        "  Add SMTP_USER and SMTP_PASS to backend/.env (Gmail: use an App Password).\n" +
        "  Then restart the backend and run: npm run test:smtp -- your@gmail.com"
    );
    return;
  }
  console.log(`[mailer] SMTP ready — host=${host} from=${from || user}`);
}

export function createSmtpTransport() {
  const { host, user, pass, port, secure } = smtpEnv();

  if (host === "smtp.gmail.com" || host === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure && port === 587,
    tls: { minVersion: "TLSv1.2" },
  });
}

function getTransporter() {
  if (transporter) return transporter;

  if (!isSmtpConfigured()) {
    return null;
  }

  transporter = createSmtpTransport();
  return transporter;
}

export function resetTransporter() {
  transporter = null;
}

export async function verifySmtpConnection() {
  const transport = getTransporter();
  if (!transport) {
    throw new Error(
      "SMTP is not configured. Set SMTP_USER and SMTP_PASS in backend/.env (Gmail requires an App Password)."
    );
  }
  await transport.verify();
  return true;
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const transport = getTransporter();
  if (!transport) {
    console.log("[mailer] SMTP not configured — password reset link:", resetUrl);
    return { sent: false, error: "SMTP_USER and SMTP_PASS are missing in backend/.env" };
  }

  const { from, user } = smtpEnv();

  try {
    const info = await transport.sendMail({
      from: from || user,
      to,
      subject: "TrashTrack City — reset your password",
      text: [
        "You requested a password reset for TrashTrack City.",
        "",
        "Reset your password (link expires in 2 minutes):",
        resetUrl,
        "",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
      html: `
      <p>You requested a password reset for <strong>TrashTrack City</strong>.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in <strong>2 minutes</strong>.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    });

    console.log("[mailer] Password reset email sent to", to, "| messageId:", info.messageId);
    return { sent: true };
  } catch (err) {
    console.error("[mailer] Failed to send password reset email:", err.message);
    if (err.message?.includes("Invalid login")) {
      console.error(
        "[mailer] Gmail tip: use an App Password from https://myaccount.google.com/apppasswords (not your normal password)."
      );
    }
    console.log("[mailer] Password reset link:", resetUrl);
    return { sent: false, error: err.message };
  }
}

export async function sendReportNotification({ to, report }) {
  const transport = getTransporter();
  if (!transport) {
    console.log("[mailer] SMTP not configured — skipping email");
    return;
  }

  const { from, user } = smtpEnv();

  await transport.sendMail({
    from: from || user,
    to,
    subject: `New report: ${report.title}`,
    text: `A new trash report was submitted.\n\nTitle: ${report.title}\nStatus: ${report.status}\nCategory: ${report.category}`,
  });
}

export async function sendNotificationEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.log("[mailer] SMTP not configured — skipping email to", to);
    return { sent: false, error: "SMTP not configured" };
  }

  const { from, user } = smtpEnv();

  try {
    const info = await transport.sendMail({
      from: from || user,
      to,
      subject: subject || "Notification from TrashTrack City",
      text: text || "",
      html: html || undefined,
    });
    console.log("[mailer] Email sent successfully:", { to, subject, messageId: info.messageId });
    return { sent: true, info };
  } catch (err) {
    console.error("[mailer] Failed to send notification email:", err?.message || err);
    return { sent: false, error: err?.message || String(err) };
  }
}
