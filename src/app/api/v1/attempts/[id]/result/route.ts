import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const { id } = await context.params;
  const attempt = await prisma.examAttempt.findFirst({ where: { id, userId: access.user.id }, include: { exam: { select: { id: true, title: true, questionCount: true } } } });
  if (!attempt) return fail("NOT_FOUND", "النتيجة غير موجودة.", request, 404);
  if (attempt.status !== "SUBMITTED") return fail("RESULT_NOT_READY", "لم يتم تسليم هذه المحاولة بعد.", request, 409);
  return ok({ id: attempt.id, exam: attempt.exam, score: attempt.totalScore, correctCount: attempt.correctCount, wrongCount: attempt.wrongCount, unansweredCount: attempt.unansweredCount, percentage: attempt.percentage?.toString() ?? "0", submittedAt: attempt.submittedAt }, request);
}
