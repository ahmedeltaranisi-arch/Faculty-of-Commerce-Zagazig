import { ExamStatus, SelectionMode } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({ title: z.string().trim().min(2).max(180).optional(), description: z.string().trim().max(3000).nullable().optional(), gradeSubjectId: z.string().min(1).optional(), questionCount: z.number().int().positive().max(200).optional(), durationSeconds: z.number().int().positive().max(24 * 60 * 60).nullable().optional(), selectionMode: z.enum(["FIXED", "RANDOM"]).optional(), maxAttempts: z.number().int().positive().max(20).optional(), startsAt: z.string().datetime().nullable().optional(), endsAt: z.string().datetime().nullable().optional(), status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]).optional() }).strict();

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.update");
  if (access.response) return access.response;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الاختبار غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const existing = await prisma.exam.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "الاختبار غير موجود.", request, 404);
  const data = parsed.data;
  const exam = await prisma.exam.update({ where: { id }, data: { title: data.title, description: data.description, gradeSubjectId: data.gradeSubjectId, questionCount: data.questionCount, durationSeconds: data.durationSeconds, selectionMode: data.selectionMode as SelectionMode | undefined, maxAttempts: data.maxAttempts, startsAt: data.startsAt === undefined ? undefined : data.startsAt ? new Date(data.startsAt) : null, endsAt: data.endsAt === undefined ? undefined : data.endsAt ? new Date(data.endsAt) : null, status: data.status as ExamStatus | undefined }, select: { id: true, title: true, status: true, questionCount: true, updatedAt: true } });
  return ok(exam, request);
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "exams.delete");
  if (access.response) return access.response;
  const { id } = await context.params;
  const existing = await prisma.exam.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail("NOT_FOUND", "الاختبار غير موجود.", request, 404);
  await prisma.exam.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  return ok({ deleted: true }, request);
}
