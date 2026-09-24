import { ContentStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "content.books.read");
  if (access.response) return access.response;
  const enrollment = await prisma.enrollment.findFirst({ where: { userId: access.user.id, isCurrent: true } });
  if (!enrollment) return fail("ACADEMIC_SCOPE_REQUIRED", "لا يوجد نطاق أكاديمي نشط للحساب.", request, 422);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));
  const search = url.searchParams.get("search")?.trim();
  const where = { status: ContentStatus.PUBLISHED, deletedAt: null, ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] } : {}), gradeSubject: { gradeId: enrollment.gradeId, isActive: true, OR: [{ trackId: enrollment.trackId }, { trackId: null }] } };
  const [items, total] = await prisma.$transaction([prisma.book.findMany({ where, include: { gradeSubject: { include: { subject: true } }, fileAsset: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } } }, orderBy: { publishedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.book.count({ where })]);
  return ok(items.map((item) => ({ ...item, fileAsset: { ...item.fileAsset, sizeBytes: item.fileAsset.sizeBytes.toString() } })), request, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}
