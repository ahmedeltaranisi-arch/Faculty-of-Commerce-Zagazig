import { ContentStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { currentEnrollment, gradeSubjectScope } from "@/server/exams/access";
import { createPlaybackToken } from "@/server/videos/cloudflare-stream";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "content.videos.read");
  if (access.response) return access.response;
  const { id } = await context.params;
  const enrollment = await currentEnrollment(access.user.id);
  if (!enrollment) return fail("ACADEMIC_SCOPE_REQUIRED", "لا يوجد نطاق أكاديمي نشط للحساب.", request, 422);
  const video = await prisma.video.findFirst({ where: { id, status: ContentStatus.PUBLISHED, deletedAt: null, gradeSubject: gradeSubjectScope(enrollment.gradeId, enrollment.trackId) } });
  if (!video) return fail("NOT_FOUND", "الفيديو غير متاح لهذا الحساب.", request, 404);
  if (video.provider !== "CLOUDFLARE_STREAM") return ok({ provider: video.provider, externalId: video.providerVideoId }, request);
  try { return ok({ provider: video.provider, ...(await createPlaybackToken(video.providerVideoId)) }, request); } catch (error) { console.error("stream_playback_error", error); return fail("VIDEO_PROVIDER_NOT_CONFIGURED", "تعذر تشغيل الفيديو حاليًا.", request, 503); }
}
