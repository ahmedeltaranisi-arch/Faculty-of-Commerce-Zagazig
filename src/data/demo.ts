export type Track = "انتظام" | "انتساب" | "كريديت" | "إنجليزي";

export type Grade = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  accent: string;
  icon: string;
  stats: { books: number; notes: number; videos: number; exams: number };
};

export type Resource = {
  id: string;
  type: "كتاب" | "مذكرة" | "فيديو" | "رابط";
  title: string;
  subject: string;
  meta: string;
  tone: "green" | "gold" | "blue" | "red";
};

export const tracks: Track[] = ["انتظام", "انتساب", "كريديت", "إنجليزي"];

export const grades: Grade[] = [
  {
    id: "first",
    label: "01",
    title: "الفرقة الأولى",
    subtitle: "أساسيات التجارة والاقتصاد",
    accent: "#3c755d",
    icon: "١",
    stats: { books: 18, notes: 26, videos: 12, exams: 4 },
  },
  {
    id: "second",
    label: "02",
    title: "الفرقة الثانية",
    subtitle: "المحاسبة والإدارة والاقتصاد",
    accent: "#b98a33",
    icon: "٢",
    stats: { books: 24, notes: 31, videos: 16, exams: 6 },
  },
  {
    id: "third",
    label: "03",
    title: "الفرقة الثالثة",
    subtitle: "تخصصات الأعمال المتقدمة",
    accent: "#456d84",
    icon: "٣",
    stats: { books: 21, notes: 29, videos: 19, exams: 5 },
  },
  {
    id: "fourth",
    label: "04",
    title: "الفرقة الرابعة",
    subtitle: "الاستعداد للتخرج وسوق العمل",
    accent: "#a64f3a",
    icon: "٤",
    stats: { books: 16, notes: 22, videos: 14, exams: 4 },
  },
];

export const demoResources: Resource[] = [
  {
    id: "r1",
    type: "مذكرة",
    title: "ملخص المحاسبة المالية — الوحدة الثالثة",
    subject: "المحاسبة المالية",
    meta: "PDF · 4.8 MB · منذ يومين",
    tone: "red",
  },
  {
    id: "r2",
    type: "كتاب",
    title: "مدخل إلى إدارة الأعمال",
    subject: "إدارة الأعمال",
    meta: "PDF · 12.4 MB · منذ 5 أيام",
    tone: "green",
  },
  {
    id: "r3",
    type: "فيديو",
    title: "شرح قائمة الدخل والمركز المالي",
    subject: "المحاسبة المالية",
    meta: "18:42 دقيقة · درس جديد",
    tone: "blue",
  },
  {
    id: "r4",
    type: "رابط",
    title: "البوابة الإلكترونية للطلاب",
    subject: "روابط مهمة",
    meta: "رابط خارجي موثوق",
    tone: "gold",
  },
];

export const quickLinks = [
  { title: "الكتب", subtitle: "مراجع المقررات", icon: "book", color: "green" },
  { title: "المذكرات", subtitle: "ملخصات ومحاضرات", icon: "note", color: "gold" },
  { title: "الفيديوهات", subtitle: "شرح مبسط للمقررات", icon: "play", color: "blue" },
  { title: "الاختبارات", subtitle: "اختبر مستواك", icon: "quiz", color: "red" },
];

export const importantLinks = [
  "موقع جامعة الزقازيق",
  "البوابة الإلكترونية للطلاب",
  "المنصة الرقمية وسداد المصروفات",
];

export const demoExams = [
  { id: "exam-1", title: "مبادئ المحاسبة المالية", subject: "المحاسبة المالية", questions: 10, duration: "15 دقيقة", status: "متاح الآن", tone: "green" },
  { id: "exam-2", title: "أساسيات إدارة الأعمال", subject: "إدارة الأعمال", questions: 12, duration: "20 دقيقة", status: "متاح الآن", tone: "gold" },
  { id: "exam-3", title: "مراجعة الاقتصاد الجزئي", subject: "مبادئ الاقتصاد", questions: 8, duration: "12 دقيقة", status: "يبدأ غدًا", tone: "blue" },
];
