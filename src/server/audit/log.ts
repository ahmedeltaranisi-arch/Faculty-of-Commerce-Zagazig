import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function recordAuditLog(input: { actorUserId?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown>; request?: Request }) {
  const userAgent = input.request?.headers.get("user-agent") ?? undefined;
  await prisma.auditLog.create({ data: { actorUserId: input.actorUserId, action: input.action, entityType: input.entityType, entityId: input.entityId, metadata: input.metadata as Prisma.InputJsonValue | undefined, userAgent } });
}
