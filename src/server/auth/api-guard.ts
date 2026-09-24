import { auth } from "@/auth";
import { fail } from "@/lib/api-response";

export async function requireApiPermission(request: Request, permission?: string) {
  const session = await auth();
  if (!session?.user) return { response: fail("UNAUTHORIZED", "يجب تسجيل الدخول أولًا.", request, 401) };
  if (session.user.status !== "ACTIVE") return { response: fail("ACCOUNT_NOT_ACTIVE", "الحساب غير مفعل أو موقوف.", request, 403) };
  if (permission && !(session.user.permissions ?? []).includes(permission) && !(session.user.permissions ?? []).includes("SUPER_ADMIN")) return { response: fail("FORBIDDEN", "ليس لديك صلاحية لتنفيذ هذه العملية.", request, 403) };
  return { user: session.user };
}
