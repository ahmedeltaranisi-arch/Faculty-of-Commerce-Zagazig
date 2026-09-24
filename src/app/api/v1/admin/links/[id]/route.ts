import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const patchSchema = z.object({ title: z.string().trim().min(2).max(180).optional(), description: z.string().trim().max(2000).nullable().optional(), url: z.string().url().max(2000).optional(), gradeId: z.string().min(1).nullable().optional(), subjectId: z.string().min(1).nullable().optional(), sortOrder: z.number().int().min(0).max(999).optional(), isActive: z.boolean().optional() }).strict();

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "content.links.update");
  if (access.response) return access.response;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات تعديل الرابط غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const existing = await prisma.importantLink.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "الرابط غير موجود.", request, 404);
  const updated = await prisma.importantLink.update({ where: { id }, data: parsed.data });
  return ok(updated, request);
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "content.links.delete");
  if (access.response) return access.response;
  const { id } = await context.params;
  const existing = await prisma.importantLink.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "الرابط غير موجود.", request, 404);
  await prisma.importantLink.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  return ok({ deleted: true }, request);
}
