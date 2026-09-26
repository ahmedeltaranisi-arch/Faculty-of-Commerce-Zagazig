import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") redirect("/login");
  return session.user;
}

export async function requirePermission(permission: string) {
  const user = await requireUser();
  const permissions = user.permissions ?? [];
  if (!permissions.includes(permission) && !permissions.includes("SUPER_ADMIN")) redirect("/dashboard");
  return user;
}
