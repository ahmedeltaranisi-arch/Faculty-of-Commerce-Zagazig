"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production this is where the error would be sent to Sentry.
  }, []);

  return <main className="page-placeholder shell" style={{ minHeight: "100vh", margin: "0 auto" }}><div className="placeholder-icon" style={{ color: "var(--red)", background: "var(--red-soft)" }}><AlertTriangle size={28} /></div><span className="section-kicker" style={{ color: "var(--red)" }}>حدث خطأ</span><h1>تعذر تحميل الصفحة</h1><p>حدثت مشكلة غير متوقعة. حاول مرة أخرى دون عرض تفاصيل تقنية حساسة.</p><button className="button button--primary" onClick={() => reset()}>إعادة المحاولة <RotateCcw size={17} /></button></main>;
}
