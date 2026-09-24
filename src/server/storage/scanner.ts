import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { FileAsset } from "@prisma/client";
import { getR2Bucket, getR2Client } from "@/server/storage/r2";

export async function scanR2Asset(asset: Pick<FileAsset, "bucket" | "objectKey" | "mimeType" | "sizeBytes">) {
  const scannerUrl = process.env.CLAMAV_URL;
  const required = process.env.FILE_SCAN_MODE !== "optional";
  if (!scannerUrl) return { safe: !required && process.env.NODE_ENV !== "production", reason: "SCANNER_NOT_CONFIGURED" };
  const object = await getR2Client().send(new GetObjectCommand({ Bucket: asset.bucket || getR2Bucket(), Key: asset.objectKey }));
  const bytes = object.Body && "transformToByteArray" in object.Body ? await object.Body.transformToByteArray() : null;
  if (!bytes) return { safe: false, reason: "OBJECT_READ_FAILED" };
  const response = await fetch(scannerUrl, { method: "POST", headers: { "Content-Type": "application/octet-stream", "X-File-Mime": asset.mimeType, "X-File-Size": asset.sizeBytes.toString() }, body: Buffer.from(bytes), cache: "no-store" });
  if (!response.ok) return { safe: false, reason: "SCANNER_ERROR" };
  const result = await response.json().catch(() => ({ clean: false })) as { clean?: boolean; infected?: boolean; reason?: string };
  return { safe: result.clean === true && result.infected !== true, reason: result.reason ?? (result.clean ? "CLEAN" : "INFECTED") };
}
