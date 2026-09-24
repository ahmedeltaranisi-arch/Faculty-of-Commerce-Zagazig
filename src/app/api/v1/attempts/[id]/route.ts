import { AttemptStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { publicQuestion } from "@/server/exams/access";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const { id } = await context.params;
  const attempt = await prisma.examAttempt.findFirst({ where: { id, userId: access.user.id }, include: { exam: { select: { id: true, title: true, durationSeconds: true, questionCount: true, questions: { orderBy: { sortOrder: "asc" }, include: { question: { include: { choices: { orderBy: { sortOrder: "asc" } } } } } } } }, answers: { select: { questionId: true, selectedChoiceId: true, isCorrect: true, answeredAt: true } } } });
  if (!attempt) return fail("NOT_FOUND", "المحاولة غير موجودة.", request, 404);
  const shouldExpire = attempt.status === AttemptStatus.IN_PROGRESS && attempt.expiresAt && attempt.expiresAt <= new Date();
  if (shouldExpire) await prisma.examAttempt.update({ where: { id }, data: { status: AttemptStatus.EXPIRED } });
  return ok({ id: attempt.id, status: shouldExpire ? AttemptStatus.EXPIRED : attempt.status, startedAt: attempt.startedAt, expiresAt: attempt.expiresAt, submittedAt: attempt.submittedAt, score: attempt.totalScore, percentage: attempt.percentage, exam: { id: attempt.exam.id, title: attempt.exam.title, durationSeconds: attempt.exam.durationSeconds, questionCount: attempt.exam.questionCount }, questions: attempt.exam.questions.map((item) => publicQuestion(item.question)), answers: attempt.answers }, request);
}
