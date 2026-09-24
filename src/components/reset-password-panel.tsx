"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";

function Panel() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/v1/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password, confirmPassword }) });
    const payload = await response.json();
    if (!response.ok) setError(payload.error?.message ?? "تعذر تغيير كلمة المرور."); else setMessage(payload.data?.message ?? "تم تغيير كلمة المرور.");
    setBusy(false);
  }
  return <div className="auth-card-wrap"><div className="auth-card"><span className="auth-heading__eyebrow">أمان حسابك</span><div className="auth-heading"><h2>تعيين كلمة مرور جديدة</h2><p>اختر كلمة مرور قوية لاستخدامها عند تسجيل الدخول.</p></div><form className="auth-form" onSubmit={submit}><label className="field"><span>كلمة المرور الجديدة</span><div className="field__input"><LockKeyhole size={17} /><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 أحرف على الأقل" /></div></label><label className="field"><span>تأكيد كلمة المرور</span><div className="field__input"><LockKeyhole size={17} /><input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="أعد كتابة كلمة المرور" /></div></label><button className="button button--primary button--full" disabled={busy || !token}>{busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}<ArrowRight size={17} /></button></form>{message && <div className="form-notice form-notice--success" role="status" aria-live="polite"><CheckCircle2 size={18} aria-hidden="true" /><span>{message} <Link href="/login">تسجيل الدخول</Link></span></div>}{error && <div className="form-notice form-notice--error" role="alert" aria-live="assertive"><AlertCircle size={18} aria-hidden="true" /><span>{error}</span></div>}</div></div>;
}

export function ResetPasswordPanel() { return <Suspense fallback={<div className="auth-loading">جاري التحميل...</div>}><Panel /></Suspense>; }
