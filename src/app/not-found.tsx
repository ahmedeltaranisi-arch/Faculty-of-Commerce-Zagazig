import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="page-placeholder shell" style={{ minHeight: "100vh", margin: "0 auto" }}><div className="placeholder-icon"><SearchX size={28} /></div><span className="section-kicker">404</span><h1>الصفحة غير موجودة</h1><p>يبدو أن الرابط الذي تبحث عنه غير متاح أو تم نقله.</p><Link className="button button--primary" href="/">العودة للرئيسية <ArrowRight size={17} /></Link></main>;
}
