import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function currentEnrollment(userId: string) {
  return prisma.enrollment.findFirst({ where: { userId, isCurrent: true }, select: { gradeId: true, trackId: true, grade: { select: { id: true, code: true, name: true } }, track: { select: { id: true, code: true, name: true } } } });
}

export function gradeSubjectScope(gradeId: string, trackId: string) {
  return { gradeId, isActive: true, OR: [{ trackId }, { trackId: null }] } satisfies Prisma.GradeSubjectWhereInput;
}

export function publicQuestion(question: { id: string; body: string; explanation?: string | null; choices: Array<{ id: string; label: string; text: string; sortOrder: number }> }) {
  return { id: question.id, body: question.body, explanation: question.explanation ?? null, choices: question.choices.sort((a, b) => a.sortOrder - b.sortOrder) };
}
