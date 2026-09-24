import { ContentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { deleteStreamVideo } from "@/server/videos/cloudflare-stream";

type RouteContext = { params: Promise<{ id: string }> };
const patchSchema = z.object({ title: z.string().trim().min(2).max(180).optional(), description: z.string().trim().max(3000).nullable().optional(), gradeSubjectId: z.string().min(1).optional(), thumbnailAssetId: z.string().min(1).nullable().optional(), durationSeconds: z.number().int().positive().max(24 * 60 * 60).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional() }).strict();

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "content.videos.update");
  if (access.response) return access.response;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الفيديو غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const existing = await prisma.video.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "الفيديو غير موجود.", request, 404);
  const data = parsed.data;
  const video = await prisma.video.update({ where: { id }, data: { title: data.title, description: data.description, gradeSubjectId: data.gradeSubjectId, thumbnailAssetId: data.thumbnailAssetId, durationSeconds: data.durationSeconds, status: data.status as ContentStatus | undefined, ...(data.status === "PUBLISHED" ? { publishedAt: existing.publishedAt ?? new Date() } : {}) }, select: { id: true, title: true, status: true, updatedAt: true } });
  return ok(video, request);
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "content.videos.delete");
  if (access.response) return access.response;
  const { id } = await context.params;
  const existing = await prisma.video.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "الفيديو غير موجود.", request, 404);
  try { await deleteStreamVideo(existing.providerVideoId); } catch (error) { console.error("stream_delete_error", error); }
  await prisma.video.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  return ok({ deleted: true }, request);
}
