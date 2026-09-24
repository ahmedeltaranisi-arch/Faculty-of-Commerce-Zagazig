import { ExamStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
import { currentEnrollment, gradeSubjectScope } from "@/server/exams/access";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const enrollment = await currentEnrollment(access.user.id);
  if (!enrollment) return fail("ACADEMIC_SCOPE_REQUIRED", "لا يوجد نطاق أكاديمي نشط للحساب.", request, 422);
  const exams = await prisma.exam.findMany({ where: { status: ExamStatus.ACTIVE, deletedAt: null, gradeSubject: gradeSubjectScope(enrollment.gradeId, enrollment.trackId) }, include: { gradeSubject: { include: { subject: { select: { id: true, name: true, slug: true } } } }, _count: { select: { questions: true } } }, orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }] });
  const now = new Date();
  const available = exams.filter((exam) => (!exam.startsAt || exam.startsAt <= now) && (!exam.endsAt || exam.endsAt >= now));
  return ok(available.map((exam) => ({ id: exam.id, title: exam.title, description: exam.description, durationSeconds: exam.durationSeconds, questionCount: exam.questionCount, availableQuestions: exam._count.questions, maxAttempts: exam.maxAttempts, subject: exam.gradeSubject.subject })), request);
}
