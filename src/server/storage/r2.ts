import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export function getR2Client() {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) throw new Error("R2 is not configured");
  client = new S3Client({ region: "auto", endpoint: process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
  return client;
}

export function getR2Bucket() {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not configured");
  return bucket;
}
