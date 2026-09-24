import { AttemptStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

type RouteContext = { params: Promise<{ id: string; questionId: string }> };
const bodySchema = z.object({ selectedChoiceId: z.string().min(1).nullable() });

export async function PUT(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const { id: attemptId, questionId } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "الإجابة غير صحيحة.", request, 422);
  const attempt = await prisma.examAttempt.findFirst({ where: { id: attemptId, userId: access.user.id }, include: { exam: { include: { questions: { where: { questionId } } } } } });
  if (!attempt) return fail("NOT_FOUND", "المحاولة غير موجودة.", request, 404);
  if (attempt.status !== AttemptStatus.IN_PROGRESS) return fail("ATTEMPT_CLOSED", "لا يمكن تعديل إجابة بعد انتهاء المحاولة.", request, 409);
  if (attempt.expiresAt && attempt.expiresAt <= new Date()) {
    await prisma.examAttempt.update({ where: { id: attemptId }, data: { status: AttemptStatus.EXPIRED } });
    return fail("EXAM_EXPIRED", "انتهى وقت الاختبار.", request, 409);
  }
  if (!attempt.exam.questions.length) return fail("QUESTION_NOT_IN_ATTEMPT", "السؤال غير موجود داخل هذه المحاولة.", request, 422);
  if (parsed.data.selectedChoiceId) {
    const choice = await prisma.choice.findFirst({ where: { id: parsed.data.selectedChoiceId, questionId } });
    if (!choice) return fail("INVALID_CHOICE", "الاختيار لا ينتمي إلى السؤال.", request, 422);
  }
  const answer = await prisma.studentAnswer.upsert({ where: { attemptId_questionId: { attemptId, questionId } }, update: { selectedChoiceId: parsed.data.selectedChoiceId, isCorrect: null, answeredAt: new Date() }, create: { attemptId, questionId, selectedChoiceId: parsed.data.selectedChoiceId } });
  return ok({ questionId: answer.questionId, selectedChoiceId: answer.selectedChoiceId, answeredAt: answer.answeredAt }, request);
}
