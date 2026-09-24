import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

export async function GET(request: Request) {
  const access = await requireApiPermission(request);
  if (access.response) return access.response;
  const url = new URL(request.url);
  const requestedGradeId = url.searchParams.get("gradeId");
  const requestedTrackId = url.searchParams.get("trackId");
  const canViewAll = (access.user.permissions ?? []).includes("SUPER_ADMIN") || (access.user.permissions ?? []).includes("users.read");
  const enrollment = canViewAll ? null : await prisma.enrollment.findFirst({ where: { userId: access.user.id, isCurrent: true } });
  const gradeId = canViewAll ? requestedGradeId : enrollment?.gradeId;
  const trackId = canViewAll ? requestedTrackId : enrollment?.trackId;
  if (!gradeId) return fail("ACADEMIC_SCOPE_REQUIRED", "لم يتم تحديد الفرقة الحالية للحساب.", request, 422);
  const subjects = await prisma.gradeSubject.findMany({ where: { gradeId, isActive: true, ...(trackId ? { OR: [{ trackId }, { trackId: null }] } : {}) }, include: { subject: { select: { id: true, name: true, slug: true, description: true } } }, orderBy: { subject: { name: "asc" } } });
  return ok(subjects.map((item) => item.subject), request);
}
