import { prisma } from "@/server/db/prisma";
import { ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

export async function GET(request: Request) {
  const access = await requireApiPermission(request);
  if (access.response) return access.response;
  const canViewAll = (access.user.permissions ?? []).includes("SUPER_ADMIN") || (access.user.permissions ?? []).includes("users.read");
  const grades = canViewAll
    ? await prisma.grade.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, code: true, name: true, sortOrder: true } })
    : await prisma.enrollment.findMany({ where: { userId: access.user.id, isCurrent: true }, include: { grade: { select: { id: true, code: true, name: true, sortOrder: true } }, track: { select: { id: true, code: true, name: true } } } });
  return ok(grades, request);
}
