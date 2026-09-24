import { prisma } from "@/server/db/prisma";
import { ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const results = await prisma.examAttempt.findMany({ where: { userId: access.user.id, status: "SUBMITTED" }, include: { exam: { select: { id: true, title: true, questionCount: true, gradeSubject: { include: { subject: { select: { name: true } } } } } } }, orderBy: { submittedAt: "desc" } });
  return ok(results.map((attempt) => ({ id: attempt.id, examId: attempt.exam.id, title: attempt.exam.title, subject: attempt.exam.gradeSubject.subject.name, score: attempt.totalScore, total: attempt.exam.questionCount, correctCount: attempt.correctCount, wrongCount: attempt.wrongCount, unansweredCount: attempt.unansweredCount, percentage: attempt.percentage?.toString() ?? "0", submittedAt: attempt.submittedAt })), request);
}
