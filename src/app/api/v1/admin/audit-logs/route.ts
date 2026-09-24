import { prisma } from "@/server/db/prisma";
import { ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "audit.read");
  if (access.response) return access.response;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "50")));
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const action = url.searchParams.get("action") ?? undefined;
  const where = { ...(entityType ? { entityType } : {}), ...(action ? { action } : {}) };
  const [items, total] = await prisma.$transaction([prisma.auditLog.findMany({ where, include: { actor: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.auditLog.count({ where })]);
  return ok(items, request, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}
