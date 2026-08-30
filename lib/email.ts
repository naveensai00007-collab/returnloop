import { Resend } from "resend";

interface ReminderEmailProps {
  toEmail: string;
  storeName: string;
  itemName?: string | null;
  returnDeadline: string;
  daysRemaining: number;
  appUrl: string;
}

export async function sendReminderEmail({
  toEmail,
  storeName,
  itemName,
  returnDeadline,
  daysRemaining,
  appUrl,
}: ReminderEmailProps): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "reminders@returnloop.app";

  // Build subject line based on urgency
  let subject = `Return window closes soon: ${storeName}`;
  if (daysRemaining === 1) {
    subject = itemName
      ? `Due tomorrow: ${itemName} from ${storeName}`
      : `Last day to return: ${storeName} order`;
  } else if (daysRemaining === 0) {
    subject = `Return deadline is TODAY: ${storeName}`;
  }

  const plainText = `
Your return window is closing.

Store: ${storeName}
${itemName ? `Item: ${itemName}\n` : ""}Return by: ${returnDeadline}

Open ReturnLoop to view or mark as returned:
${appUrl}/dashboard

To adjust your reminder settings:
${appUrl}/settings
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; color: #18181B; margin: 0; padding: 24px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 12px; padding: 32px;">
    
    <!-- Brand Wordmark -->
    <div style="margin-bottom: 24px;">
      <span style="font-size: 20px; font-weight: 500; color: #18181B;">Return<strong style="color: #15803D; font-weight: 700;">Loop</strong></span>
    </div>

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #18181B;">
      Your return window is closing.
    </h1>

    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534;"><strong>Store:</strong> ${storeName}</p>
      ${itemName ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #166534;"><strong>Item:</strong> ${itemName}</p>` : ""}
      <p style="margin: 0; font-size: 14px; color: #166534;"><strong>Return Deadline:</strong> ${returnDeadline}</p>
    </div>

    <div style="margin-bottom: 32px;">
      <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #15803D; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
        Open ReturnLoop
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #E4E4E7; margin: 24px 0;" />

    <p style="font-size: 12px; color: #71717A; margin: 0;">
      You received this because you tracked a purchase on ReturnLoop.
      <br />
      <a href="${appUrl}/settings" style="color: #52525B; text-decoration: underline;">Change reminder preferences</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  // If no Resend API key configured in dev/test mode, simulate and log
  if (!apiKey) {
    console.log(`[Email Mock Dispatch] To: ${toEmail} | Subject: ${subject}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      text: plainText,
      html,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email sending failed.";
    return { success: false, error: message };
  }
}
