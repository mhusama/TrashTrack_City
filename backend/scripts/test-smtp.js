import "dotenv/config";
import {
  createSmtpTransport,
  isSmtpConfigured,
  resetTransporter,
  smtpEnv,
  verifySmtpConnection,
} from "../src/utils/mailer.js";

async function main() {
  const to = process.argv[2] || process.env.SMTP_USER?.trim();

  if (!isSmtpConfigured()) {
    console.error(
      "SMTP is not fully configured.\n" +
        "  Set SMTP_USER and SMTP_PASS in backend/.env\n" +
        "  Gmail: https://myaccount.google.com/apppasswords (16-char app password, not your login password)\n" +
        "  Then restart the backend."
    );
    process.exit(1);
  }

  resetTransporter();

  console.log("Verifying SMTP connection…");
  await verifySmtpConnection();
  console.log("SMTP connection OK.");

  if (!to) {
    console.log("Usage: npm run test:smtp -- your@gmail.com");
    process.exit(0);
  }

  const transport = createSmtpTransport();
  const { from, user } = smtpEnv();

  const info = await transport.sendMail({
    from: from || user,
    to,
    subject: "TrashTrack City — SMTP test",
    text: "If you received this, SMTP is configured correctly.",
  });

  console.log("Test email sent to", to);
  console.log("messageId:", info.messageId);
}

main().catch((err) => {
  console.error("SMTP test failed:", err.message);
  if (String(err.message).includes("Invalid login")) {
    console.error("Use a Gmail App Password: https://myaccount.google.com/apppasswords");
  }
  process.exit(1);
});
