import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";
const schema = z.object({ code: z.string().trim().min(2).max(30).toUpperCase(), name: z.string().trim().min(2).max(100), sortOrder: z.number().int().min(0).max(99), isActive: z.boolean().default(true) });
export async function GET(request: Request) { const access = await requireApiPermission(request, "academic.manage"); if (access.response) return access.response; return ok(await prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }), request); }
export async function POST(request: Request) { const access = await requireApiPermission(request, "academic.manage"); if (access.response) return access.response; const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الفرقة غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors); const item = await prisma.grade.create({ data: parsed.data }); return ok(item, request); }
