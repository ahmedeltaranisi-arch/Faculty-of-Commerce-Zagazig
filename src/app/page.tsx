import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { grades, quickLinks } from "@/data/demo";

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="التنقل الرئيسي">
            <a href="#features">مميزات المنصة</a>
            <a href="#grades">الفرق الدراسية</a>
            <a href="#about">عن المنصة</a>
          </nav>
          <div className="header-actions">
            <Link className="button button--ghost button--small" href="/login">
              تسجيل الدخول
            </Link>
            <Link className="button button--dark button--small" href="/login?mode=register">
              حساب جديد <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="hero shell">
        <div className="hero__content">
          <div className="eyebrow"><Sparkles size={16} /> مساحة تعليمية لطلاب تجارة الزقازيق</div>
          <h1>كل ما تحتاجه في <span>رحلتك الجامعية</span> في مكان واحد.</h1>
          <p>
            منصة تعليمية منظمة لطلاب كلية التجارة بجامعة الزقازيق؛ تجمع الكتب والمذكرات والفيديوهات والاختبارات في تجربة عربية بسيطة وسريعة.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary button--large" href="/login?mode=register">
              ابدأ رحلتك الآن <ArrowLeft size={18} />
            </Link>
            <Link className="text-link" href="#grades">
              استكشف الفرق <ArrowUpLeft size={17} />
            </Link>
          </div>
          <div className="hero__trust">
            <span><CheckCircle2 size={17} /> محتوى مرتب حسب فرقتك وشعبتك</span>
            <span><ShieldCheck size={17} /> حساب آمن لكل طالب</span>
          </div>
        </div>
        <div className="hero__visual" aria-label="نظرة سريعة على المنصة">
          <div className="hero-orbit hero-orbit--one" />
          <div className="hero-orbit hero-orbit--two" />
          <div className="hero-card hero-card--main">
            <div className="hero-card__topline"><span className="status-dot" /> لوحة الطالب</div>
            <div className="hero-card__heading"><span>صباح الخير، أحمد</span><span className="avatar">أ</span></div>
            <div className="hero-card__grade">
              <div><small>فرقتك الحالية</small><strong>الفرقة الثانية</strong><span>انتظام · كلية التجارة</span></div>
              <div className="grade-number">٢</div>
            </div>
            <div className="mini-progress"><div /><span>٦٥٪ من أهدافك هذا الأسبوع</span></div>
            <div className="hero-card__stats">
              <div><BookOpen size={17} /><strong>24</strong><span>كتابًا</span></div>
              <div><PlayCircle size={17} /><strong>16</strong><span>فيديو</span></div>
              <div><ClipboardCheck size={17} /><strong>06</strong><span>اختبارات</span></div>
            </div>
          </div>
          <div className="floating-note floating-note--gold"><span>نتيجة آخر اختبار</span><strong>8.5 / 10</strong><small>أحسنت، استمر!</small></div>
          <div className="floating-note floating-note--white"><span className="tiny-icon"><GraduationCap size={16} /></span><strong>تعلم بتركيز</strong><small>مساحتك الخاصة للمذاكرة</small></div>
        </div>
      </section>

      <section id="features" className="section shell">
        <div className="section-heading">
          <div><span className="section-kicker">صُممت لتناسب يومك</span><h2>أدواتك الدراسية، <span>أقرب وأسهل.</span></h2></div>
          <p>من أول تسجيل الدخول وحتى آخر سؤال في الاختبار، كل خطوة مصممة لتكون واضحة ومريحة.</p>
        </div>
        <div className="feature-grid">
          {quickLinks.map((item) => (
            <article className={`feature-card feature-card--${item.color}`} key={item.title}>
              <span className="feature-card__icon">{item.icon === "book" ? <BookOpen size={22} /> : item.icon === "note" ? <ClipboardCheck size={22} /> : item.icon === "play" ? <PlayCircle size={22} /> : <GraduationCap size={22} />}</span>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
              <ArrowUpLeft size={18} className="feature-card__arrow" />
            </article>
          ))}
        </div>
      </section>

      <section id="grades" className="section section--soft">
        <div className="shell">
          <div className="section-heading section-heading--center">
            <span className="section-kicker">محتوى مخصص لك</span>
            <h2>اختر فرقتك وابدأ <span>من مكانك.</span></h2>
            <p>سيظهر لكل طالب المحتوى الخاص بفرقته وشعبته بعد تسجيل الحساب وتفعيله.</p>
          </div>
          <div className="grade-grid">
            {grades.map((grade) => (
              <article className="grade-card" key={grade.id} style={{ "--grade-accent": grade.accent } as React.CSSProperties}>
                <div className="grade-card__number">{grade.icon}</div>
                <div className="grade-card__body"><span>{grade.label} · تجارة الزقازيق</span><h3>{grade.title}</h3><p>{grade.subtitle}</p></div>
                <div className="grade-card__footer"><small>{grade.stats.books + grade.stats.notes + grade.stats.videos + grade.stats.exams} مورد تعليمي</small><ArrowLeft size={17} /></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section shell about-section">
        <div className="about-panel">
          <div className="about-panel__mark"><GraduationCap size={30} /></div>
          <div><span className="section-kicker">كلية التجارة - جامعة الزقازيق</span><h2>مذاكرة أكثر تنظيمًا، <span>وخطوة أقرب للنجاح.</span></h2><p>منصة أكاديمية خاصة بطلاب الكلية، مبنية لتكون نقطة الوصول اليومية للمحتوى والمراجعة والاختبارات.</p></div>
          <Link className="button button--light" href="/login?mode=register">إنشاء حساب طالب <ArrowLeft size={17} /></Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-inner"><Brand compact /><span>© {new Date().getFullYear()} كلية التجارة - جامعة الزقازيق</span><span>منصة تعليمية للطلاب</span></div>
      </footer>
    </main>
  );
}
