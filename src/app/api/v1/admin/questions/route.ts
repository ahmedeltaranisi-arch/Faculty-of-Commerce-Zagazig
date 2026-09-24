import { Difficulty, ContentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const choiceSchema = z.object({ text: z.string().trim().min(1).max(1000) });
const bodySchema = z.object({ gradeSubjectId: z.string().min(1), body: z.string().trim().min(3).max(5000), explanation: z.string().trim().max(3000).optional(), difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"), choices: z.array(choiceSchema).length(4), correctChoiceIndex: z.number().int().min(0).max(3) });

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const url = new URL(request.url);
  const gradeSubjectId = url.searchParams.get("gradeSubjectId");
  const questions = await prisma.question.findMany({ where: { deletedAt: null, ...(gradeSubjectId ? { gradeSubjectId } : {}) }, include: { choices: { orderBy: { sortOrder: "asc" } }, correctAnswer: { select: { choiceId: true } }, gradeSubject: { include: { grade: true, subject: true, track: true } } }, orderBy: { createdAt: "desc" } });
  return ok(questions, request);
}

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "exams.create");
  if (access.response) return access.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات السؤال يجب أن تحتوي على أربعة اختيارات وإجابة صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const data = parsed.data;
  const question = await prisma.$transaction(async (tx) => {
    const created = await tx.question.create({ data: { gradeSubjectId: data.gradeSubjectId, body: data.body, explanation: data.explanation, difficulty: data.difficulty as Difficulty, status: data.status as ContentStatus, createdById: access.user.id } });
    const choices = [];
    for (let index = 0; index < data.choices.length; index += 1) choices.push(await tx.choice.create({ data: { questionId: created.id, label: String.fromCharCode(65 + index), text: data.choices[index].text, sortOrder: index } }));
    await tx.correctAnswer.create({ data: { questionId: created.id, choiceId: choices[data.correctChoiceIndex].id } });
    return { ...created, choices };
  });
  return ok(question, request);
}
