import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { fileRules, safeFileName } from "@/server/storage/file-rules";
import { getR2Bucket, getR2Client } from "@/server/storage/r2";

const bodySchema = z.object({ kind: z.enum(["book", "note", "image"]), fileName: z.string().min(1).max(180), mimeType: z.string(), sizeBytes: z.number().int().positive() });

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الملف غير صحيحة.", request, 422);
  const permission = parsed.data.kind === "book" ? "content.books.create" : parsed.data.kind === "note" ? "content.notes.create" : "content.books.create";
  const access = await requireApiPermission(request, permission);
  if (access.response) return access.response;
  const rule = fileRules[parsed.data.kind];
  if (!(rule.mimeTypes as readonly string[]).includes(parsed.data.mimeType)) return fail("FILE_TYPE_REJECTED", "نوع الملف غير مسموح.", request, 415);
  if (parsed.data.sizeBytes > rule.maxBytes) return fail("FILE_TOO_LARGE", "حجم الملف يتجاوز الحد المسموح.", request, 413);
  try {
    const bucket = getR2Bucket();
    const objectKey = `private/${process.env.NODE_ENV === "production" ? "production" : "staging"}/${parsed.data.kind}/${crypto.randomUUID()}-${safeFileName(parsed.data.fileName)}`;
    const uploadUrl = await getSignedUrl(getR2Client(), new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: parsed.data.mimeType, Metadata: { uploadedBy: access.user.id, originalName: safeFileName(parsed.data.fileName) } }), { expiresIn: 600 });
    return ok({ bucket, objectKey, uploadUrl, expiresIn: 600 }, request);
  } catch (error) {
    console.error("r2_presign_error", error);
    return fail("STORAGE_NOT_CONFIGURED", "خدمة التخزين غير متاحة حاليًا.", request, 503);
  }
}
