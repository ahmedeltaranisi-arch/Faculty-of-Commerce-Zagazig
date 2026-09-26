import { UserStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "users.read");
  if (access.response) return access.response;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "25")));
  const search = url.searchParams.get("search")?.trim();
  const status = url.searchParams.get("status") as UserStatus | null;
  const where = { deletedAt: null, ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { normalizedEmail: { contains: search.toLowerCase(), mode: "insensitive" as const } }] } : {}), ...(status && Object.values(UserStatus).includes(status) ? { status } : {}) };
  const [users, total] = await prisma.$transaction([prisma.user.findMany({ where, select: { id: true, name: true, email: true, status: true, emailVerified: true, lastLoginAt: true, createdAt: true, roles: { select: { role: { select: { name: true } } } }, enrollments: { where: { isCurrent: true }, select: { grade: { select: { name: true } }, track: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.user.count({ where })]);
  return ok(users, request, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}
