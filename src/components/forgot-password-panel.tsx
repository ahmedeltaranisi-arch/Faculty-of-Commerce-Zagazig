"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";

export function ForgotPasswordPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/v1/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const payload = await response.json();
    setMessage(payload.data?.message ?? payload.error?.message ?? "تم إرسال الطلب.");
    setBusy(false);
  }
  return <div className="auth-layout"><div className="auth-art"><Link href="/login" className="auth-back"><ArrowRight size={17} /> العودة لتسجيل الدخول</Link><div className="auth-art__content"><span className="section-kicker">استعادة الوصول</span><h1>لا تقلق،<br /><span>سنساعدك.</span></h1><p>أدخل البريد المرتبط بحسابك وسنرسل لك رابطًا آمنًا لتعيين كلمة مرور جديدة.</p></div></div><div className="auth-card-wrap"><div className="auth-card"><span className="auth-heading__eyebrow">إعادة تعيين كلمة المرور</span><div className="auth-heading"><h2>هل نسيت كلمة المرور؟</h2><p>سنرسل رابط الاستعادة إلى بريدك الإلكتروني.</p></div><form className="auth-form" onSubmit={submit}><label className="field"><span>البريد الإلكتروني</span><div className="field__input"><Mail size={17} /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div></label><button className="button button--primary button--full" disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}<ArrowRight size={17} /></button></form>{message && <div className="form-notice form-notice--success" role="status" aria-live="polite"><CheckCircle2 size={18} aria-hidden="true" /><span>{message}</span></div>}<p className="auth-footnote"><Link href="/login">العودة لتسجيل الدخول</Link></p></div></div></div>;
}
