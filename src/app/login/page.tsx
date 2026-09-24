import { Suspense } from "react";
import { LoginPanel } from "@/components/login-panel";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-loading">جاري التحميل...</div>}>
        <LoginPanel />
      </Suspense>
    </main>
  );
}
