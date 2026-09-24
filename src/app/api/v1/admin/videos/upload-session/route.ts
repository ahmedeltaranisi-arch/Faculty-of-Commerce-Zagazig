import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { createDirectUpload } from "@/server/videos/cloudflare-stream";

const schema = z.object({ maxDurationSeconds: z.number().int().positive().max(8 * 60 * 60).default(7200) });

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "content.videos.create");
  if (access.response) return access.response;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("VALIDATION_ERROR", "مدة الفيديو غير صحيحة.", request, 422);
  try {
    const upload = await createDirectUpload(parsed.data.maxDurationSeconds);
    return ok({ provider: "CLOUDFLARE_STREAM", providerVideoId: upload.uid, uploadUrl: upload.uploadURL, expiresIn: 3600 }, request);
  } catch (error) {
    console.error("stream_upload_session_error", error);
    return fail("VIDEO_PROVIDER_NOT_CONFIGURED", "خدمة الفيديو غير متاحة حاليًا.", request, 503);
  }
}
