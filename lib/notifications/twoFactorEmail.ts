type TwoFactorEmailPurpose = "login" | "register" | "admin-login";

type SendTwoFactorCodeInput = {
  to: string;
  code: string;
  purpose: TwoFactorEmailPurpose;
};

function resolveSubject(purpose: TwoFactorEmailPurpose) {
  if (purpose === "register") {
    return "קוד אימות להרשמה למועדון";
  }
  if (purpose === "admin-login") {
    return "קוד אימות לכניסת מנהל";
  }
  return "קוד אימות להתחברות למועדון";
}

function resolveHeadline(purpose: TwoFactorEmailPurpose) {
  if (purpose === "register") {
    return "אימות הרשמה למועדון";
  }
  if (purpose === "admin-login") {
    return "אימות כניסת מנהל";
  }
  return "אימות התחברות למועדון";
}

function buildHtmlBody(input: SendTwoFactorCodeInput) {
  const headline = resolveHeadline(input.purpose);
  return `
    <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111111">
      <h2 style="margin:0 0 12px 0;">${headline}</h2>
      <p style="margin:0 0 12px 0;">הקוד שלך הוא:</p>
      <p style="margin:0 0 18px 0;font-size:28px;letter-spacing:0.35em;font-weight:700;">${input.code}</p>
      <p style="margin:0;">הקוד תקף ל-10 דקות.</p>
    </div>
  `;
}

export async function sendTwoFactorCodeEmail(input: SendTwoFactorCodeInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { sent: false as const, reason: "missing_config" as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: resolveSubject(input.purpose),
        html: buildHtmlBody(input)
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return { sent: false as const, reason: "provider_error" as const };
    }

    return { sent: true as const };
  } catch {
    return { sent: false as const, reason: "network_error" as const };
  }
}
