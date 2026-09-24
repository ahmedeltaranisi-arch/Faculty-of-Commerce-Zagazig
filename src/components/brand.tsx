import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand ${compact ? "brand--compact" : ""}`} href="/" aria-label="كلية التجارة جامعة الزقازيق">
      <span className="brand__logo">
        <Image src="/logo.png" alt="شعار كلية التجارة جامعة الزقازيق" width={62} height={62} priority />
      </span>
      <span className="brand__copy">
        <strong>كلية التجارة</strong>
        <span>جامعة الزقازيق</span>
      </span>
    </Link>
  );
}
