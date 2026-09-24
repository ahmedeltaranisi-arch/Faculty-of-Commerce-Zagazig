import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

type RouteContext = { params: Promise<{ id: string }> };
const bodySchema = z.object({ questionId: z.string().min(1), sortOrder: z.number().int().min(0).optional(), points: z.number().int().positive().max(100).default(1) });

export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.update");
  if (access.response) return access.response;
  const { id: examId } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات ربط السؤال غير صحيحة.", request, 422);
  const exam = await prisma.exam.findFirst({ where: { id: examId, deletedAt: null } });
  const question = await prisma.question.findFirst({ where: { id: parsed.data.questionId, deletedAt: null } });
  if (!exam || !question) return fail("NOT_FOUND", "الاختبار أو السؤال غير موجود.", request, 404);
  const existing = await prisma.examQuestion.count({ where: { examId } });
  const row = await prisma.examQuestion.upsert({ where: { examId_questionId: { examId, questionId: question.id } }, update: { sortOrder: parsed.data.sortOrder ?? existing, points: parsed.data.points }, create: { examId, questionId: question.id, sortOrder: parsed.data.sortOrder ?? existing, points: parsed.data.points } });
  return ok(row, request);
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.update");
  if (access.response) return access.response;
  const { id: examId } = await context.params;
  const questionId = new URL(request.url).searchParams.get("questionId");
  if (!questionId) return fail("VALIDATION_ERROR", "questionId مطلوب.", request, 422);
  await prisma.examQuestion.deleteMany({ where: { examId, questionId } });
  return ok({ deleted: true }, request);
}
