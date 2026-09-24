import crypto from "node:crypto";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function createOpaqueToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

async function sendEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.EMAIL_API_KEY;
  const endpoint = process.env.EMAIL_PROVIDER_URL ?? "https://api.resend.com/emails";
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email-preview] ${input.subject}: ${input.to}`);
      console.info(input.html.match(/https?:\/\/[^"'< ]+/)?.[0] ?? "No preview link");
      return { delivered: false, preview: true };
    }
    throw new Error("EMAIL_NOT_CONFIGURED");
  }
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }), cache: "no-store" });
  if (!response.ok) throw new Error("EMAIL_PROVIDER_ERROR");
  return { delivered: true, preview: false };
}

export function verificationUrl(rawToken: string) {
  return `${appUrl()}/api/v1/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
}

export function resetPasswordUrl(rawToken: string) {
  return `${appUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export async function sendVerificationEmail(to: string, name: string, rawToken: string) {
  const url = verificationUrl(rawToken);
  return sendEmail({ to, subject: "فعّل حسابك في منصة كلية التجارة", html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>مرحبًا ${name}</h2><p>اضغط على الرابط التالي لتفعيل حسابك في منصة كلية التجارة - جامعة الزقازيق.</p><p><a href="${url}">تفعيل البريد الإلكتروني</a></p><p>الرابط صالح لمدة 24 ساعة.</p></div>` });
}

export async function sendPasswordResetEmail(to: string, name: string, rawToken: string) {
  const url = resetPasswordUrl(rawToken);
  return sendEmail({ to, subject: "إعادة تعيين كلمة المرور", html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>مرحبًا ${name}</h2><p>تلقينا طلبًا لإعادة تعيين كلمة المرور.</p><p><a href="${url}">إعادة تعيين كلمة المرور</a></p><p>الرابط صالح لمدة ساعة واحدة، وإذا لم تطلب ذلك يمكنك تجاهل الرسالة.</p></div>` });
}
