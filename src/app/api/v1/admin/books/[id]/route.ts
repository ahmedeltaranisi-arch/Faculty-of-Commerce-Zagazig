import { ContentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const patchSchema = z.object({ title: z.string().trim().min(2).max(180).optional(), description: z.string().trim().max(3000).nullable().optional(), gradeSubjectId: z.string().min(1).optional(), fileAssetId: z.string().min(1).optional(), coverAssetId: z.string().min(1).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional() }).strict();

export async function PATCH(request: Request, context: RouteContext<"/api/v1/admin/books/[id]">) {
  const access = await requireApiPermission(request, "content.books.update");
  if (access.response) return access.response;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات التعديل غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const existing = await prisma.book.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "الكتاب غير موجود.", request, 404);
  const item = await prisma.book.update({ where: { id }, data: { ...parsed.data, ...(parsed.data.status ? { status: parsed.data.status as ContentStatus, publishedAt: parsed.data.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt } : {}) }, select: { id: true, title: true, status: true, updatedAt: true } });
  return ok(item, request);
}

export async function DELETE(request: Request, context: RouteContext<"/api/v1/admin/books/[id]">) {
  const access = await requireApiPermission(request, "content.books.delete");
  if (access.response) return access.response;
  const { id } = await context.params;
  const existing = await prisma.book.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "الكتاب غير موجود.", request, 404);
  await prisma.book.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  return ok({ deleted: true }, request);
}
