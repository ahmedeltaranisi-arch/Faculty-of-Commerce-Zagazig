"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { ArrowLeft, Bell, BookOpen, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, Download, ExternalLink, FileText, Home, LayoutDashboard, LogOut, Menu, PlayCircle, Search, Settings, ShieldCheck, Trophy, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { demoExams, demoResources, grades, importantLinks, type Resource } from "@/data/demo";

const navItems = [
  { label: "الرئيسية", icon: Home },
  { label: "الكتب", icon: BookOpen },
  { label: "المذكرات", icon: FileText },
  { label: "الفيديوهات", icon: PlayCircle },
  { label: "الاختبارات", icon: ClipboardCheck },
];

function ResourceLibrary({ title, subtitle, items }: { title: string; subtitle: string; items: Resource[] }) {
  return <section className="dashboard-section library-preview"><div className="dashboard-section__head"><div><span className="section-kicker">الفرقة الثانية · انتظام</span><h2>{title} <span>الخاصة بك</span></h2></div><span className="scope-pill">{items.length} موارد</span></div><p className="library-preview__subtitle">{subtitle}</p><div className="resource-list">{items.map((resource) => <article className="resource-row" key={resource.id}><span className={`resource-type resource-type--${resource.tone}`}>{resource.type === "كتاب" ? <BookOpen size={19} /> : resource.type === "مذكرة" ? <FileText size={19} /> : <PlayCircle size={19} />}</span><div className="resource-row__info"><strong>{resource.title}</strong><span>{resource.subject} · {resource.meta}</span></div><button className="resource-action" aria-label={resource.type === "فيديو" ? "مشاهدة الفيديو" : "تحميل الملف"}>{resource.type === "فيديو" ? <PlayCircle size={18} /> : <Download size={17} />}</button></article>)}</div></section>;
}

export function StudentDashboard() {
  const [activeNav, setActiveNav] = useState("الرئيسية");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const grade = grades[1];
  const resources = useMemo(() => demoResources.filter((resource) => resource.title.includes(query) || resource.subject.includes(query)), [query]);

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${mobileOpen ? "dashboard-sidebar--open" : ""}`}>
        <div className="sidebar-top"><Brand compact /><button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة"><X size={20} /></button></div>
        <div className="profile-chip"><div className="profile-avatar">أ</div><div><strong>أحمد محمد</strong><span>الفرقة الثانية · انتظام</span></div><ChevronDown size={15} /></div>
        <nav className="dashboard-nav" aria-label="قائمة الطالب">
          <span className="nav-label">مساحتي الدراسية</span>
          {navItems.map(({ label, icon: Icon }) => <button key={label} className={activeNav === label ? "active" : ""} onClick={() => { setActiveNav(label); setMobileOpen(false); }}><Icon size={18} /><span>{label}</span>{label === "الاختبارات" && <em>2</em>}</button>)}
          <span className="nav-label nav-label--spaced">حسابي</span>
          <button><Settings size={18} /><span>الإعدادات</span></button>
        </nav>
        <div className="sidebar-help"><ShieldCheck size={22} /><div><strong>محتوى مخصص لك</strong><span>يظهر لك محتوى فرقتك وشعبتك فقط.</span></div></div>
        <button type="button" className="sidebar-logout" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={17} /> تسجيل الخروج</button>
      </aside>
      {mobileOpen && <button className="dashboard-overlay" onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة" />}
      <main className="dashboard-main">
        <header className="dashboard-header"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة"><Menu size={21} /></button><div className="header-breadcrumb"><span>مساحتي</span><ArrowLeft size={14} /><strong>{activeNav}</strong></div><label className="dashboard-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في محتوى فرقتك..." aria-label="البحث في المحتوى" /></label><div className="dashboard-header__actions"><button className="icon-circle" aria-label="الإشعارات"><Bell size={18} /><i /></button><div className="header-avatar">أ</div></div></header>
        <div className="dashboard-content">
          {activeNav === "الرئيسية" ? <>
            <section className="welcome-card"><div><span className="welcome-card__eyebrow">الأحد، ٢٤ سبتمبر ٢٠٢٦</span><h1>أهلًا بك يا أحمد <span>👋</span></h1><p>جاهز تكمل خطوتك التالية؟ اختر من مساحتك الدراسية وابدأ.</p><div className="welcome-card__tags"><span><CheckCircle2 size={15} /> حسابك مفعل</span><span>الفرقة الثانية · انتظام</span></div></div><div className="welcome-card__illustration"><div className="illustration-sun" /><div className="illustration-book book-one" /><div className="illustration-book book-two" /><div className="illustration-pencil" /></div></section>
            <section className="dashboard-section"><div className="dashboard-section__head"><div><span className="section-kicker">المحتوى المتاح لك</span><h2>مساحة <span>الفرقة الثانية</span></h2></div><span className="scope-pill">انتظام · خاص بك</span></div><div className="dashboard-stats"><div className="dashboard-stat"><span className="stat-icon stat-icon--green"><BookOpen size={18} /></span><div><strong>{grade.stats.books}</strong><span>كتابًا متاحًا</span></div></div><div className="dashboard-stat"><span className="stat-icon stat-icon--gold"><FileText size={18} /></span><div><strong>{grade.stats.notes}</strong><span>مذكرة وملخص</span></div></div><div className="dashboard-stat"><span className="stat-icon stat-icon--blue"><PlayCircle size={18} /></span><div><strong>{grade.stats.videos}</strong><span>فيديو شرح</span></div></div><div className="dashboard-stat"><span className="stat-icon stat-icon--red"><ClipboardCheck size={18} /></span><div><strong>{grade.stats.exams}</strong><span>اختبارات متاحة</span></div></div></div></section>
            <section className="dashboard-section"><div className="dashboard-section__head"><div><span className="section-kicker">آخر ما أُضيف</span><h2>واصل <span>تعلمك</span></h2></div><button className="section-link" onClick={() => setActiveNav("الكتب")}>عرض الكل <ArrowLeft size={15} /></button></div><div className="resource-list">{resources.map((resource) => <article className="resource-row" key={resource.id}><span className={`resource-type resource-type--${resource.tone}`}>{resource.type === "كتاب" ? <BookOpen size={19} /> : resource.type === "مذكرة" ? <FileText size={19} /> : resource.type === "فيديو" ? <PlayCircle size={19} /> : <ExternalLink size={19} />}</span><div className="resource-row__info"><strong>{resource.title}</strong><span>{resource.subject} · {resource.meta}</span></div><button className="resource-action" aria-label={resource.type === "فيديو" ? "مشاهدة" : "فتح"}>{resource.type === "فيديو" ? <PlayCircle size={18} /> : resource.type === "رابط" ? <ExternalLink size={17} /> : <Download size={17} />}</button></article>)}</div></section>
          </> : activeNav === "الكتب" ? <ResourceLibrary title="الكتب" subtitle="مراجع المقررات والكتب الأساسية المتاحة لفرقتك وشعبتك." items={resources.filter((resource) => resource.type === "كتاب")} /> : activeNav === "المذكرات" ? <ResourceLibrary title="المذكرات" subtitle="ملخصات المحاضرات والأسئلة المساعدة للمراجعة قبل الاختبار." items={resources.filter((resource) => resource.type === "مذكرة")} /> : activeNav === "الفيديوهات" ? <ResourceLibrary title="فيديوهات الشرح" subtitle="شروحات مختصرة تساعدك على فهم المقررات بطريقة عملية." items={resources.filter((resource) => resource.type === "فيديو")} /> : activeNav === "الاختبارات" ? <section className="dashboard-section exam-library"><div className="dashboard-section__head"><div><span className="section-kicker">اختبر مستواك</span><h2>الاختبارات <span>المتاحة لك</span></h2></div><span className="scope-pill">الفرقة الثانية · انتظام</span></div><div className="exam-library__intro"><div><Trophy size={24} /><div><strong>كل إجابة نقطة</strong><span>يتم احتساب النتيجة على الخادم بعد التسليم.</span></div></div><span>يمكنك مراجعة الأسئلة أثناء المحاولة</span></div><div className="exam-grid">{demoExams.map((exam) => <article className="exam-tile" key={exam.id}><div className={`exam-tile__icon resource-type--${exam.tone}`}><ClipboardCheck size={21} /></div><span className="exam-tile__status">{exam.status}</span><h3>{exam.title}</h3><p>{exam.subject}</p><div className="exam-tile__meta"><span><ClipboardCheck size={14} /> {exam.questions} أسئلة</span><span><Clock3 size={14} /> {exam.duration}</span></div><Link className="button button--primary button--full" href={`/dashboard/exams/${exam.id}`}>ابدأ الاختبار <ArrowLeft size={16} /></Link></article>)}</div></section> : <section className="dashboard-section page-placeholder"><div className="placeholder-icon"><LayoutDashboard size={28} /></div><span className="section-kicker">قسم الطالب</span><h1>{activeNav}</h1><p>هذا القسم جاهز للربط بمحتوى الفرقة الثانية والشعبة المحددة بعد تشغيل قاعدة البيانات.</p><button className="button button--primary" onClick={() => setActiveNav("الرئيسية")}>العودة للرئيسية <ArrowLeft size={17} /></button></section>}
          <section className="dashboard-bottom-grid"><div className="links-card"><div className="dashboard-section__head"><div><span className="section-kicker">اختصارات الطالب</span><h2>روابط <span>تهمك</span></h2></div><ExternalLink size={17} /></div>{importantLinks.map((link) => <a className="important-link" href="#" key={link}><span>{link}</span><ArrowLeft size={15} /></a>)}</div><div className="exam-card"><div className="exam-card__top"><span className="stat-icon stat-icon--red"><ClipboardCheck size={19} /></span><span className="exam-badge">متاح الآن</span></div><span className="section-kicker">اختبار مقترح لك</span><h3>مبادئ المحاسبة المالية</h3><p>10 أسئلة · 15 دقيقة · نقطة لكل سؤال</p><Link className="button button--dark button--full" href="/dashboard/exams/exam-1">ابدأ الاختبار <ArrowLeft size={16} /></Link></div></section>
        </div>
      </main>
    </div>
  );
}
