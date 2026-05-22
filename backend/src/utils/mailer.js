import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

export async function sendReportNotification({ to, report }) {
  const transport = getTransporter();
  if (!transport) {
    console.log("[mailer] SMTP not configured — skipping email");
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || "noreply@trashtrack.local",
    to,
    subject: `New report: ${report.title}`,
    text: `A new trash report was submitted.\n\nTitle: ${report.title}\nStatus: ${report.status}\nCategory: ${report.category}`,
  });
}
