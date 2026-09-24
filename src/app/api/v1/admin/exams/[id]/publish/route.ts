import { ExamStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.publish");
  if (access.response) return access.response;
  const { id } = await context.params;
  const exam = await prisma.exam.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { questions: true } } } });
  if (!exam) return fail("NOT_FOUND", "الاختبار غير موجود.", request, 404);
  if (exam._count.questions < exam.questionCount) return fail("INSUFFICIENT_QUESTIONS", "عدد الأسئلة المرتبطة أقل من العدد المحدد للاختبار.", request, 422);
  const updated = await prisma.exam.update({ where: { id }, data: { status: ExamStatus.ACTIVE, startsAt: exam.startsAt ?? new Date() }, select: { id: true, title: true, status: true, startsAt: true } });
  return ok(updated, request);
}
