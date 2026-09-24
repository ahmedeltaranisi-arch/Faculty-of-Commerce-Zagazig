import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const bodySchema = z.object({ title: z.string().trim().min(2).max(180), description: z.string().trim().max(2000).optional(), url: z.string().url().max(2000), gradeId: z.string().min(1).nullable().optional(), subjectId: z.string().min(1).nullable().optional(), sortOrder: z.number().int().min(0).max(999).default(0), isActive: z.boolean().default(true) });

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "content.links.read");
  if (access.response) return access.response;
  const links = await prisma.importantLink.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], include: { grade: { select: { name: true } }, subject: { select: { name: true } } } });
  return ok(links, request);
}

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "content.links.create");
  if (access.response) return access.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات الرابط غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const link = await prisma.importantLink.create({ data: { ...parsed.data, createdById: access.user.id } });
  return ok(link, request);
}
