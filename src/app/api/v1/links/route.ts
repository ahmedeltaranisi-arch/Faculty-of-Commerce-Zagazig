import { prisma } from "@/server/db/prisma";
import { ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "content.links.read");
  if (access.response) return access.response;
  const enrollment = await prisma.enrollment.findFirst({ where: { userId: access.user.id, isCurrent: true } });
  const links = await prisma.importantLink.findMany({ where: { isActive: true, deletedAt: null, OR: [{ gradeId: null, subjectId: null }, ...(enrollment ? [{ gradeId: enrollment.gradeId }] : [])] }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], select: { id: true, title: true, description: true, url: true, sortOrder: true } });
  return ok(links, request);
}
