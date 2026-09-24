import { FileStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { recordAuditLog } from "@/server/audit/log";
import { scanR2Asset } from "@/server/storage/scanner";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "content.books.update");
  if (access.response) return access.response;
  const { id } = await context.params;
  const asset = await prisma.fileAsset.findFirst({ where: { id, deletedAt: null } });
  if (!asset) return fail("NOT_FOUND", "الملف غير موجود.", request, 404);
  await prisma.fileAsset.update({ where: { id }, data: { status: FileStatus.SCANNING } });
  try {
    const result = asset.provider === "R2" ? await scanR2Asset(asset) : { safe: false, reason: "UNSUPPORTED_PROVIDER" };
    const status = result.safe ? FileStatus.READY : FileStatus.QUARANTINED;
    await prisma.fileAsset.update({ where: { id }, data: { status } });
    await recordAuditLog({ actorUserId: access.user.id, action: result.safe ? "FILE_SCAN_CLEAN" : "FILE_SCAN_QUARANTINED", entityType: "FileAsset", entityId: id, metadata: { reason: result.reason }, request });
    return ok({ id, status, reason: result.reason }, request);
  } catch (error) {
    console.error("file_scan_error", error);
    await prisma.fileAsset.update({ where: { id }, data: { status: FileStatus.QUARANTINED } });
    return fail("FILE_SCAN_FAILED", "تعذر فحص الملف وتم وضعه في العزل.", request, 503);
  }
}
