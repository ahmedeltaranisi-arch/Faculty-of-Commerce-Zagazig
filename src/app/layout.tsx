import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "كلية التجارة - جامعة الزقازيق",
    template: "%s | كلية التجارة - جامعة الزقازيق",
  },
  description: "المنصة التعليمية لطلاب كلية التجارة بجامعة الزقازيق — كتب، مذكرات، فيديوهات واختبارات.",
  applicationName: "منصة كلية التجارة - جامعة الزقازيق",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  keywords: ["كلية التجارة", "جامعة الزقازيق", "منصة تعليمية", "مذكرات تجارة", "اختبارات تجارة"],
  openGraph: {
    title: "كلية التجارة - جامعة الزقازيق",
    description: "مساحتك التعليمية الخاصة بطلاب كلية التجارة بجامعة الزقازيق.",
    locale: "ar_EG",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
