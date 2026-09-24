import { prisma } from "@/server/db/prisma";
import { ok, fail } from "@/lib/api-response";

export async function POST(request: Request) {
  const configuredSecret = process.env.STREAM_WEBHOOK_SECRET;
  const incomingSecret = request.headers.get("x-stream-webhook-secret");
  if (!configuredSecret || incomingSecret !== configuredSecret) return fail("UNAUTHORIZED", "Webhook غير مصرح.", request, 401);
  const payload = await request.json().catch(() => null) as { uid?: string; duration?: number; status?: { state?: string } } | null;
  if (!payload?.uid) return fail("VALIDATION_ERROR", "بيانات webhook غير صحيحة.", request, 422);
  const video = await prisma.video.findFirst({ where: { providerVideoId: payload.uid, deletedAt: null } });
  if (!video) return ok({ ignored: true }, request);
  await prisma.video.update({ where: { id: video.id }, data: { durationSeconds: payload.duration ? Math.round(payload.duration) : video.durationSeconds } });
  return ok({ received: true, state: payload.status?.state ?? "unknown" }, request);
}
