import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ContentStatus, StorageProvider } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { currentEnrollment } from "@/server/exams/access";
import { getR2Client } from "@/server/storage/r2";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request);
  if (access.response) return access.response;
  const { id } = await context.params;
  const asset = await prisma.fileAsset.findFirst({ where: { id, status: "READY", deletedAt: null }, include: { books: { where: { status: ContentStatus.PUBLISHED, deletedAt: null }, include: { gradeSubject: true } }, notes: { where: { status: ContentStatus.PUBLISHED, deletedAt: null }, include: { gradeSubject: true } } } });
  if (!asset) return fail("NOT_FOUND", "الملف غير موجود أو لم يجهز بعد.", request, 404);
  const isSuperAdmin = (access.user.permissions ?? []).includes("SUPER_ADMIN");
  if (!isSuperAdmin) {
    const enrollment = await currentEnrollment(access.user.id);
    const allowed = Boolean(enrollment && [...asset.books, ...asset.notes].some((item) => item.gradeSubject.gradeId === enrollment.gradeId && (item.gradeSubject.trackId === null || item.gradeSubject.trackId === enrollment.trackId)));
    if (!allowed) return fail("FORBIDDEN", "لا يمكنك الوصول إلى هذا الملف.", request, 403);
  }
  if (asset.provider !== StorageProvider.R2) return fail("UNSUPPORTED_STORAGE", "مزود التخزين غير مدعوم لهذا الملف.", request, 501);
  try {
    const url = await getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: asset.bucket, Key: asset.objectKey, ResponseContentDisposition: `attachment; filename="${asset.safeName}"`, ResponseContentType: asset.mimeType }), { expiresIn: 300 });
    return ok({ url, expiresIn: 300, fileName: asset.safeName, mimeType: asset.mimeType }, request);
  } catch (error) { console.error("file_access_error", error); return fail("STORAGE_NOT_CONFIGURED", "تعذر تجهيز رابط الملف.", request, 503); }
}
