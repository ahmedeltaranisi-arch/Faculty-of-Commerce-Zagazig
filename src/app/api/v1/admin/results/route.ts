import { prisma } from "@/server/db/prisma";
import { ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "results.read");
  if (access.response) return access.response;
  const url = new URL(request.url);
  const examId = url.searchParams.get("examId");
  const results = await prisma.examAttempt.findMany({ where: { status: "SUBMITTED", ...(examId ? { examId } : {}) }, include: { user: { select: { id: true, name: true, email: true } }, exam: { select: { id: true, title: true } } }, orderBy: { submittedAt: "desc" }, take: 200 });
  return ok(results.map((attempt) => ({ id: attempt.id, student: attempt.user, exam: attempt.exam, score: attempt.totalScore, correctCount: attempt.correctCount, wrongCount: attempt.wrongCount, unansweredCount: attempt.unansweredCount, percentage: attempt.percentage?.toString() ?? "0", submittedAt: attempt.submittedAt })), request);
}
