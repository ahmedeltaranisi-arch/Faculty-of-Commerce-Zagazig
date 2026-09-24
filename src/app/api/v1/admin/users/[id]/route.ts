import { UserStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { recordAuditLog } from "@/server/audit/log";

type RouteContext = { params: Promise<{ id: string }> };
const schema = z.object({ name: z.string().trim().min(2).max(100).optional(), status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DELETED"]).optional() }).strict();

export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "users.read");
  if (access.response) return access.response;
  const { id } = await context.params;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, status: true, emailVerifiedAt: true, lastLoginAt: true, createdAt: true, roles: { select: { role: { select: { id: true, name: true, description: true } } } }, enrollments: { orderBy: { createdAt: "desc" }, include: { grade: true, track: true } } } });
  if (!user) return fail("NOT_FOUND", "المستخدم غير موجود.", request, 404);
  return ok(user, request);
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "users.update");
  if (access.response) return access.response;
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات المستخدم غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const current = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, status: true } });
  if (!current) return fail("NOT_FOUND", "المستخدم غير موجود.", request, 404);
  const updated = await prisma.user.update({ where: { id }, data: { name: parsed.data.name, status: parsed.data.status as UserStatus | undefined }, select: { id: true, name: true, email: true, status: true, updatedAt: true } });
  await recordAuditLog({ actorUserId: access.user.id, action: "USER_UPDATED", entityType: "User", entityId: id, metadata: { before: current, after: updated }, request });
  return ok(updated, request);
}
