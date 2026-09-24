import { ContentStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { currentEnrollment, gradeSubjectScope } from "@/server/exams/access";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "content.videos.read");
  if (access.response) return access.response;
  const enrollment = await currentEnrollment(access.user.id);
  if (!enrollment) return fail("ACADEMIC_SCOPE_REQUIRED", "لا يوجد نطاق أكاديمي نشط للحساب.", request, 422);
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const videos = await prisma.video.findMany({ where: { status: ContentStatus.PUBLISHED, deletedAt: null, ...(search ? { title: { contains: search, mode: "insensitive" } } : {}), gradeSubject: gradeSubjectScope(enrollment.gradeId, enrollment.trackId) }, include: { gradeSubject: { include: { subject: { select: { id: true, name: true, slug: true } } } }, thumbnail: { select: { id: true, mimeType: true } } }, orderBy: { publishedAt: "desc" } });
  return ok(videos.map((video) => ({ id: video.id, title: video.title, description: video.description, durationSeconds: video.durationSeconds, subject: video.gradeSubject.subject, thumbnailAssetId: video.thumbnailAssetId })), request);
}
