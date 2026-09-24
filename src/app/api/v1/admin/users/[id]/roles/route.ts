import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { recordAuditLog } from "@/server/audit/log";

type RouteContext = { params: Promise<{ id: string }> };
const schema = z.object({ roleIds: z.array(z.string().min(1)).min(1).max(10) });

export async function PUT(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "roles.manage");
  if (access.response) return access.response;
  const { id } = await context.params;
  if (id === access.user.id) return fail("SELF_ROLE_CHANGE_BLOCKED", "لا يمكنك تغيير صلاحيات حسابك من نفس الجلسة.", request, 409);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "يجب اختيار دور واحد على الأقل.", request, 422);
  const roles = await prisma.role.findMany({ where: { id: { in: parsed.data.roleIds } }, select: { id: true, name: true } });
  if (roles.length !== parsed.data.roleIds.length) return fail("INVALID_ROLE", "يوجد دور غير صالح.", request, 422);
  const current = await prisma.userRole.findMany({ where: { userId: id }, select: { roleId: true } });
  await prisma.$transaction([prisma.userRole.deleteMany({ where: { userId: id } }), prisma.userRole.createMany({ data: parsed.data.roleIds.map((roleId) => ({ userId: id, roleId })) })]);
  await recordAuditLog({ actorUserId: access.user.id, action: "USER_ROLES_UPDATED", entityType: "User", entityId: id, metadata: { before: current.map((item) => item.roleId), after: parsed.data.roleIds }, request });
  return ok({ userId: id, roles }, request);
}
