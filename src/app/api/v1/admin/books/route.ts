import { ContentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const bodySchema = z.object({ title: z.string().trim().min(2).max(180), description: z.string().trim().max(3000).optional(), gradeSubjectId: z.string().min(1), fileAssetId: z.string().min(1), coverAssetId: z.string().min(1).optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT") });

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "content.books.read");
  if (access.response) return access.response;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));
  const search = url.searchParams.get("search")?.trim();
  const where = { deletedAt: null, ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}) };
  const [items, total] = await prisma.$transaction([prisma.book.findMany({ where, include: { gradeSubject: { include: { grade: true, subject: true, track: true } }, fileAsset: { select: { id: true, originalName: true, status: true, sizeBytes: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.book.count({ where })]);
  return ok(items.map((item) => ({ ...item, fileAsset: { ...item.fileAsset, sizeBytes: item.fileAsset.sizeBytes.toString() } })), request, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "content.books.create");
  if (access.response) return access.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الكتاب غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const item = await prisma.book.create({ data: { ...parsed.data, status: parsed.data.status as ContentStatus, createdById: access.user.id, publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null }, select: { id: true, title: true, status: true, createdAt: true } });
  return ok(item, request);
}
