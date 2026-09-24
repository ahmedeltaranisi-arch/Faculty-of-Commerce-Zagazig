import { AttemptStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

type RouteContext = { params: Promise<{ id: string }> };
const bodySchema = z.object({ submissionKey: z.string().uuid().optional() }).optional();

export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات التسليم غير صحيحة.", request, 422);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.examAttempt.findFirst({ where: { id, userId: access.user.id }, include: { exam: { include: { questions: { orderBy: { sortOrder: "asc" }, include: { question: { include: { correctAnswer: true } } } } } }, answers: true } });
      if (!attempt) throw new Error("NOT_FOUND");
      if (attempt.status === AttemptStatus.SUBMITTED) return { alreadySubmitted: true, attempt };
      if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new Error("ATTEMPT_CLOSED");
      if (attempt.expiresAt && attempt.expiresAt <= new Date()) {
        await tx.examAttempt.update({ where: { id }, data: { status: AttemptStatus.EXPIRED } });
        throw new Error("EXAM_EXPIRED");
      }
      const answers = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;
      let totalScore = 0;
      const totalPoints = attempt.exam.questions.reduce((sum, item) => sum + item.points, 0);
      for (const item of attempt.exam.questions) {
        const answer = answers.get(item.questionId);
        const isCorrect = Boolean(answer?.selectedChoiceId && answer.selectedChoiceId === item.question.correctAnswer?.choiceId);
        if (!answer?.selectedChoiceId) unansweredCount += 1;
        else if (isCorrect) { correctCount += 1; totalScore += item.points; }
        else wrongCount += 1;
        if (answer) await tx.studentAnswer.update({ where: { id: answer.id }, data: { isCorrect } });
        else await tx.studentAnswer.create({ data: { attemptId: id, questionId: item.questionId, selectedChoiceId: null, isCorrect: false } });
      }
      const percentage = totalPoints ? Number(((totalScore / totalPoints) * 100).toFixed(2)) : 0;
      const updated = await tx.examAttempt.update({ where: { id }, data: { status: AttemptStatus.SUBMITTED, submittedAt: new Date(), correctCount, wrongCount, unansweredCount, totalScore, percentage, submissionKey: parsed.data?.submissionKey ?? crypto.randomUUID() } });
      return { alreadySubmitted: false, attempt: updated };
    });
    const attempt = result.attempt;
    return ok({ id: attempt.id, status: attempt.status, score: attempt.totalScore, correctCount: attempt.correctCount, wrongCount: attempt.wrongCount, unansweredCount: attempt.unansweredCount, percentage: attempt.percentage?.toString() ?? "0", submittedAt: attempt.submittedAt, alreadySubmitted: result.alreadySubmitted }, request);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return fail("NOT_FOUND", "المحاولة غير موجودة.", request, 404);
    if (error instanceof Error && error.message === "ATTEMPT_CLOSED") return fail("ATTEMPT_CLOSED", "لا يمكن تسليم هذه المحاولة.", request, 409);
    if (error instanceof Error && error.message === "EXAM_EXPIRED") return fail("EXAM_EXPIRED", "انتهى وقت الاختبار.", request, 409);
    console.error("submit_attempt_error", error);
    return fail("INTERNAL_ERROR", "تعذر حساب نتيجة الاختبار.", request, 500);
  }
}
