import { AttemptStatus, ExamStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { currentEnrollment, gradeSubjectScope, publicQuestion } from "@/server/exams/access";

type RouteContext = { params: Promise<{ id: string }> };

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const { id } = await context.params;
  const enrollment = await currentEnrollment(access.user.id);
  if (!enrollment) return fail("ACADEMIC_SCOPE_REQUIRED", "لا يوجد نطاق أكاديمي نشط للحساب.", request, 422);
  const exam = await prisma.exam.findFirst({ where: { id, status: ExamStatus.ACTIVE, deletedAt: null, gradeSubject: gradeSubjectScope(enrollment.gradeId, enrollment.trackId) }, include: { questions: { orderBy: { sortOrder: "asc" }, include: { question: { include: { choices: { orderBy: { sortOrder: "asc" } } } } } } } });
  if (!exam) return fail("NOT_FOUND", "الاختبار غير متاح لهذا الحساب.", request, 404);
  const now = new Date();
  if ((exam.startsAt && exam.startsAt > now) || (exam.endsAt && exam.endsAt < now)) return fail("EXAM_NOT_AVAILABLE", "الاختبار غير متاح في الوقت الحالي.", request, 409);
  const attempts = await prisma.examAttempt.findMany({ where: { examId: id, userId: access.user.id }, orderBy: { attemptNumber: "desc" }, select: { attemptNumber: true, status: true } });
  const activeAttempt = attempts.find((attempt) => attempt.status === AttemptStatus.IN_PROGRESS);
  if (activeAttempt) return fail("ATTEMPT_IN_PROGRESS", "لديك محاولة مفتوحة لهذا الاختبار بالفعل.", request, 409);
  if (attempts.length >= exam.maxAttempts) return fail("MAX_ATTEMPTS_REACHED", "تم استهلاك عدد المحاولات المسموح.", request, 409);
  if (exam.questions.length < exam.questionCount) return fail("INSUFFICIENT_QUESTIONS", "الاختبار غير مكتمل من جهة الإدارة.", request, 422);
  const selectedQuestions = exam.selectionMode === "RANDOM" ? shuffle(exam.questions).slice(0, exam.questionCount) : exam.questions.slice(0, exam.questionCount);
  const attemptNumber = (attempts[0]?.attemptNumber ?? 0) + 1;
  const expiresAt = exam.durationSeconds ? new Date(now.getTime() + exam.durationSeconds * 1000) : null;
  const attempt = await prisma.examAttempt.create({ data: { examId: id, userId: access.user.id, attemptNumber, expiresAt }, select: { id: true, status: true, startedAt: true, expiresAt: true, attemptNumber: true } });
  return ok({ ...attempt, exam: { id: exam.id, title: exam.title, durationSeconds: exam.durationSeconds, questionCount: selectedQuestions.length }, questions: selectedQuestions.map((item) => publicQuestion(item.question)) }, request);
}
