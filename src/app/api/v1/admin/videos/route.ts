import { ContentStatus, VideoProvider } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const bodySchema = z.object({ title: z.string().trim().min(2).max(180), description: z.string().trim().max(3000).optional(), gradeSubjectId: z.string().min(1), providerVideoId: z.string().min(1).max(200), thumbnailAssetId: z.string().min(1).optional(), durationSeconds: z.number().int().positive().max(24 * 60 * 60).optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT") });

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "content.videos.read");
  if (access.response) return access.response;
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const videos = await prisma.video.findMany({ where: { deletedAt: null, ...(search ? { title: { contains: search, mode: "insensitive" } } : {}) }, include: { gradeSubject: { include: { grade: true, subject: true, track: true } }, thumbnail: { select: { id: true, objectKey: true, mimeType: true } } }, orderBy: { createdAt: "desc" } });
  return ok(videos, request);
}

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "content.videos.create");
  if (access.response) return access.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الفيديو غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const data = parsed.data;
  const video = await prisma.video.create({ data: { title: data.title, description: data.description, gradeSubjectId: data.gradeSubjectId, provider: VideoProvider.CLOUDFLARE_STREAM, providerVideoId: data.providerVideoId, thumbnailAssetId: data.thumbnailAssetId, durationSeconds: data.durationSeconds, status: data.status as ContentStatus, publishedAt: data.status === "PUBLISHED" ? new Date() : null, createdById: access.user.id }, select: { id: true, title: true, provider: true, providerVideoId: true, status: true, createdAt: true } });
  return ok(video, request);
}
