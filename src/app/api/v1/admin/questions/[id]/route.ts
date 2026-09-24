import { ContentStatus, Difficulty } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({ body: z.string().trim().min(3).max(5000).optional(), explanation: z.string().trim().max(3000).nullable().optional(), difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(), correctChoiceId: z.string().min(1).optional() }).strict();

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.update");
  if (access.response) return access.response;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات السؤال غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const existing = await prisma.question.findFirst({ where: { id, deletedAt: null }, include: { choices: true } });
  if (!existing) return fail("NOT_FOUND", "السؤال غير موجود.", request, 404);
  if (parsed.data.correctChoiceId && !existing.choices.some((choice) => choice.id === parsed.data.correctChoiceId)) return fail("INVALID_CHOICE", "الإجابة الصحيحة لا تنتمي إلى السؤال.", request, 422);
  const updated = await prisma.$transaction(async (tx) => {
    const question = await tx.question.update({ where: { id }, data: { body: parsed.data.body, explanation: parsed.data.explanation, difficulty: parsed.data.difficulty as Difficulty | undefined, status: parsed.data.status as ContentStatus | undefined } });
    if (parsed.data.correctChoiceId) await tx.correctAnswer.upsert({ where: { questionId: id }, update: { choiceId: parsed.data.correctChoiceId }, create: { questionId: id, choiceId: parsed.data.correctChoiceId } });
    return question;
  });
  return ok(updated, request);
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.delete");
  if (access.response) return access.response;
  const { id } = await context.params;
  const existing = await prisma.question.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "السؤال غير موجود.", request, 404);
  await prisma.question.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  return ok({ deleted: true }, request);
}
