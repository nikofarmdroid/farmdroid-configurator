/**
 * Email template for sending dealer quotes to customers.
 * Uses SendGrid in production; logs to console in local dev mode.
 */

interface QuoteEmailParams {
  toEmail: string;
  toName: string;
  dealerCompany: string;
  dealerName: string;
  quoteReference: string;
  shareUrl: string;
  validUntil: string | null;
  locale: string;
}

/**
 * Send a quote notification email to a customer.
 * In production: sends via SendGrid.
 * In local dev: logs to console.
 */
export async function sendQuoteEmail(params: QuoteEmailParams): Promise<void> {
  const {
    toEmail,
    toName,
    dealerCompany,
    dealerName,
    quoteReference,
    shareUrl,
    validUntil,
    locale,
  } = params;

  const validUntilText = validUntil
    ? `This quote is valid until ${new Date(validUntil).toLocaleDateString(
        locale === "da" ? "da-DK" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )}.`
    : "";

  const subject =
    locale === "da"
      ? `Dit FarmDroid FD20 tilbud fra ${dealerCompany}`
      : `Your FarmDroid FD20 Quote from ${dealerCompany}`;

  const greeting =
    locale === "da"
      ? `Hej ${toName || ""}`
      : `Hello ${toName || ""}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background-color: #f5f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white;">
    <tr>
      <td style="padding: 32px 24px; background-color: #059669; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">FarmDroid</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="margin: 0 0 16px; color: #1c1917; font-size: 20px;">${greeting},</h2>
        <p style="margin: 0 0 24px; color: #57534e; font-size: 16px; line-height: 1.5;">
          ${dealerName} from <strong>${dealerCompany}</strong> has prepared a FarmDroid FD20 quote for you.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 8px; color: #065f46; font-size: 14px; font-weight: 500;">
                Quote Reference: ${quoteReference}
              </p>
              <p style="margin: 0; color: #047857; font-size: 13px;">
                ${validUntilText}
              </p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${shareUrl}" style="display: inline-block; padding: 14px 32px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            ${locale === "da" ? "Se dit tilbud" : "View Your Quote"} →
          </a>
        </div>

        <p style="margin: 0 0 8px; color: #78716c; font-size: 14px; text-align: center;">
          Or copy this link:
        </p>
        <p style="margin: 0 0 24px; color: #44403c; font-size: 13px; text-align: center; word-break: break-all;">
          ${shareUrl}
        </p>

        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />

        <p style="margin: 0 0 8px; color: #a8a29e; font-size: 12px; text-align: center;">
          ${locale === "da"
            ? `Dette tilbud er sendt af ${dealerName} hos ${dealerCompany}.`
            : `This quote was sent by ${dealerName} at ${dealerCompany}.`}
        </p>
        <p style="margin: 0; color: #a8a29e; font-size: 12px; text-align: center;">
          ${locale === "da"
            ? "FarmDroid ApS · Vejle, Danmark"
            : "FarmDroid ApS · Vejle, Denmark"}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const USE_LOCAL = process.env.USE_LOCAL_BACKEND === "true";

  if (USE_LOCAL) {
    console.log("[quote-email] Would send email:");
    console.log("  To:", toEmail);
    console.log("  Subject:", subject);
    console.log("  Quote ref:", quoteReference);
    console.log("  Share URL:", shareUrl);
    return;
  }

  // Production: use SendGrid
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: toEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || "noreply@farmdroid.com",
        name: dealerCompany,
      },
      subject,
      html,
    });
  } catch (error) {
    console.error("[quote-email] SendGrid error:", error);
    throw error;
  }
}
