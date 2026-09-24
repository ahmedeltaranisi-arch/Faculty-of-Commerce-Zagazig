import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
type RouteContext = { params: Promise<{ id: string }> };
const schema = z.object({ name: z.string().trim().min(2).max(120).optional(), description: z.string().trim().max(2000).nullable().optional(), isActive: z.boolean().optional() }).strict();
export async function PATCH(request: Request, context: RouteContext) { const access = await requireApiPermission(request, "academic.manage"); if (access.response) return access.response; const { id } = await context.params; const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات المادة غير صحيحة.", request, 422); const item = await prisma.subject.update({ where: { id }, data: parsed.data }).catch(() => null); if (!item) return fail("NOT_FOUND", "المادة غير موجودة.", request, 404); return ok(item, request); }
export async function DELETE(request: Request, context: RouteContext) { const access = await requireApiPermission(request, "academic.manage"); if (access.response) return access.response; const { id } = await context.params; const item = await prisma.subject.update({ where: { id }, data: { isActive: false } }).catch(() => null); if (!item) return fail("NOT_FOUND", "المادة غير موجودة.", request, 404); return ok({ archived: true }, request); }
