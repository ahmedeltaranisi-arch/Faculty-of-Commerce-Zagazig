import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
const schema = z.object({ gradeId: z.string().min(1), subjectId: z.string().min(1), trackId: z.string().min(1).nullable().optional(), isActive: z.boolean().default(true) });
export async function GET(request: Request) { const access = await requireApiPermission(request, "academic.manage"); if (access.response) return access.response; return ok(await prisma.gradeSubject.findMany({ include: { grade: true, subject: true, track: true }, orderBy: { grade: { sortOrder: "asc" } } }), request); }
export async function POST(request: Request) { const access = await requireApiPermission(request, "academic.manage"); if (access.response) return access.response; const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات ربط المادة غير صحيحة.", request, 422); return ok(await prisma.gradeSubject.create({ data: parsed.data }), request); }
