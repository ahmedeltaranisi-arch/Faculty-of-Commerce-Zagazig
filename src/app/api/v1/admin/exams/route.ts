import { ExamStatus, SelectionMode } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const bodySchema = z.object({ title: z.string().trim().min(2).max(180), description: z.string().trim().max(3000).optional(), gradeSubjectId: z.string().min(1), questionCount: z.number().int().positive().max(200), durationSeconds: z.number().int().positive().max(24 * 60 * 60).nullable().optional(), selectionMode: z.enum(["FIXED", "RANDOM"]).default("FIXED"), maxAttempts: z.number().int().positive().max(20).default(1), startsAt: z.string().datetime().nullable().optional(), endsAt: z.string().datetime().nullable().optional(), status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]).default("DRAFT") });

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "exams.read");
  if (access.response) return access.response;
  const exams = await prisma.exam.findMany({ where: { deletedAt: null }, include: { gradeSubject: { include: { grade: true, subject: true, track: true } }, _count: { select: { questions: true, attempts: true } } }, orderBy: { createdAt: "desc" } });
  return ok(exams, request);
}

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "exams.create");
  if (access.response) return access.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الاختبار غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const data = parsed.data;
  const exam = await prisma.exam.create({ data: { title: data.title, description: data.description, gradeSubjectId: data.gradeSubjectId, questionCount: data.questionCount, durationSeconds: data.durationSeconds, selectionMode: data.selectionMode as SelectionMode, maxAttempts: data.maxAttempts, startsAt: data.startsAt ? new Date(data.startsAt) : null, endsAt: data.endsAt ? new Date(data.endsAt) : null, status: data.status as ExamStatus, createdById: access.user.id }, select: { id: true, title: true, status: true, questionCount: true, createdAt: true } });
  return ok(exam, request);
}
