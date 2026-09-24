import { z } from "zod";
import { StorageProvider, FileStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const bodySchema = z.object({ kind: z.enum(["book", "note", "image"]), objectKey: z.string().startsWith("private/"), originalName: z.string().min(1).max(180), safeName: z.string().min(1).max(120), mimeType: z.string().min(1), sizeBytes: z.number().int().positive(), sha256: z.string().length(64).optional() });

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الملف غير صحيحة.", request, 422);
  const permission = parsed.data.kind === "book" ? "content.books.create" : parsed.data.kind === "note" ? "content.notes.create" : "content.books.create";
  const access = await requireApiPermission(request, permission);
  if (access.response) return access.response;
  const bucket = process.env.R2_BUCKET;
  if (!bucket) return fail("STORAGE_NOT_CONFIGURED", "خدمة التخزين غير مهيأة.", request, 503);
  const fileData = parsed.data;
  const asset = await prisma.fileAsset.create({ data: { provider: StorageProvider.R2, bucket, objectKey: fileData.objectKey, originalName: fileData.originalName, safeName: fileData.safeName, mimeType: fileData.mimeType, sizeBytes: BigInt(fileData.sizeBytes), sha256: fileData.sha256, status: FileStatus.SCANNING, uploadedById: access.user.id }, select: { id: true, objectKey: true, status: true, mimeType: true, sizeBytes: true } });
  return ok({ ...asset, sizeBytes: asset.sizeBytes.toString() }, request);
}
