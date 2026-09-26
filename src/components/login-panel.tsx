"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { tracks } from "@/data/demo";

const gradeOptions = [
  ["first", "الفرقة الأولى"],
  ["second", "الفرقة الثانية"],
  ["third", "الفرقة الثالثة"],
  ["fourth", "الفرقة الرابعة"],
] as const;

const trackCodes: Record<string, string> = { انتظام: "regular", انتساب: "affiliate", كريديت: "credit", إنجليزي: "english" };

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(searchParams.get("mode") === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(() => searchParams.get("verified") === "success" ? "تم تفعيل بريدك الإلكتروني، يمكنك تسجيل الدخول الآن." : searchParams.get("verified") === "error" ? "رابط التفعيل غير صالح أو منتهي." : "");
  const [error, setError] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("انتظام");
  const [busy, setBusy] = useState(false);
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const heading = useMemo(() => mode === "login" ? "مرحبًا بعودتك" : "أنشئ حسابك الدراسي", [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    try {
      if (demoMode) {
        setNotice(mode === "login" ? "تم تسجيل الدخول في وضع المعاينة." : "تم إنشاء الحساب في وضع المعاينة. عند تشغيل قاعدة البيانات سيتم تفعيل البريد الإلكتروني فعليًا.");
        if (mode === "login") window.setTimeout(() => router.push("/dashboard"), 650);
        return;
      }

      if (mode === "register") {
        const response = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            email,
            password,
            confirmPassword: form.get("confirmPassword"),
            gradeCode: form.get("gradeCode"),
            trackCode: trackCodes[String(form.get("trackName") ?? "انتظام")],
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message ?? "تعذر إنشاء الحساب.");
        setNotice(payload.data?.message ?? "تم إنشاء الحساب. تحقق من بريدك الإلكتروني.");
      } else {
        const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/dashboard" });
        if (!result) throw new Error("تعذر تسجيل الدخول حاليًا.");
        if (result.error === "CredentialsSignin") throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        if (result.error) throw new Error("تعذر تشغيل تسجيل الدخول حاليًا. راجع إعدادات الخادم وقاعدة البيانات.");
        router.push("/dashboard");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "حدث خطأ غير متوقع.");
    } finally {
      setBusy(false);
    }
  }

  async function socialLogin(provider: "google" | "facebook") {
    setError("");
    if (demoMode) {
      setNotice("أزرار OAuth جاهزة، وسيتم تشغيلها بعد إضافة مفاتيح Google وFacebook.");
      return;
    }
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      setError("خيار الدخول الاجتماعي غير مفعّل حاليًا.");
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-art">
        <Link href="/" className="auth-back"><ArrowRight size={17} /> العودة للرئيسية</Link>
        <div className="auth-art__content">
          <div className="auth-logo-large"><Image src="/logo.png" alt="شعار كلية التجارة جامعة الزقازيق" width={112} height={112} priority /></div>
          <span className="section-kicker">كلية التجارة - جامعة الزقازيق</span>
          <h1>مساحتك الخاصة<br /><span>للتعلم والإنجاز.</span></h1>
          <p>سجّل دخولك للوصول إلى محتوى فرقتك وشعبتك، وابدأ مراجعتك من المكان الصحيح.</p>
          <div className="auth-art__quote">«النجاح في التجارة يبدأ بفهم الأساسيات، ويكبر بالاستمرارية.»</div>
        </div>
      </div>
      <div className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); setNotice(""); }}>تسجيل الدخول</button><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); setNotice(""); }}>حساب جديد</button></div>
          <div className="auth-heading"><span className="auth-heading__eyebrow">منصة طلاب تجارة الزقازيق</span><h2>{heading}</h2><p>{mode === "login" ? "أدخل بياناتك للوصول إلى لوحة الطالب." : "بياناتك الأكاديمية تحدد المحتوى الظاهر لك."}</p></div>
          <form onSubmit={submit} className="auth-form">
            {mode === "register" && <label className="field"><span>الاسم بالكامل</span><div className="field__input"><UserRound size={17} /><input required minLength={2} name="name" autoComplete="name" placeholder="مثال: أحمد محمد" /></div></label>}
            <label className="field"><span>البريد الإلكتروني</span><div className="field__input"><Mail size={17} /><input required type="email" name="email" autoComplete="email" placeholder="name@example.com" /></div></label>
            {mode === "register" && <div className="field-row"><label className="field"><span>الفرقة</span><select name="gradeCode" defaultValue="second">{gradeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="field"><span>الشعبة</span><select name="trackName" value={selectedTrack} onChange={(event) => setSelectedTrack(event.target.value)}>{tracks.map((track) => <option key={track}>{track}</option>)}</select></label></div>}
            <label className="field"><span>كلمة المرور</span><div className="field__input"><LockKeyhole size={17} /><input required minLength={8} type={showPassword ? "text" : "password"} name="password" autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder="8 أحرف على الأقل" /><button type="button" className="field__toggle" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            {mode === "register" && <label className="field"><span>تأكيد كلمة المرور</span><div className="field__input"><LockKeyhole size={17} /><input required minLength={8} type="password" name="confirmPassword" autoComplete="new-password" placeholder="أعد كتابة كلمة المرور" /></div></label>}
            {mode === "login" && <div className="form-meta"><label><input type="checkbox" defaultChecked /> تذكرني</label><Link className="link-button" href="/forgot-password">نسيت كلمة المرور؟</Link></div>}
            <button className="button button--primary button--full" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}{!busy && <ArrowRight size={17} />}</button>
          </form>
          <div className="auth-divider"><span>أو تابع باستخدام</span></div>
          <div className="social-buttons"><button type="button" className="social-button" onClick={() => socialLogin("google")}><span className="google-g">G</span> Google</button><button type="button" className="social-button" onClick={() => socialLogin("facebook")}><span className="google-g" style={{ color: "#1877f2" }}>f</span> Facebook</button></div>
          {notice && <div className="form-notice form-notice--success" role="status" aria-live="polite"><CheckCircle2 size={18} aria-hidden="true" /><span>{notice}</span></div>}
          {error && <div className="form-notice form-notice--error" role="alert" aria-live="assertive"><AlertCircle size={18} aria-hidden="true" /><span>{error}</span></div>}
          <p className="auth-footnote">بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية.</p>
        </div>
      </div>
    </div>
  );
}
