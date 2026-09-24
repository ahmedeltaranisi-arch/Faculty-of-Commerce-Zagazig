import { ContentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { requireApiPermission } from "@/server/auth/api-guard";

const bodySchema = z.object({ title: z.string().trim().min(2).max(180), description: z.string().trim().max(3000).optional(), gradeSubjectId: z.string().min(1), fileAssetId: z.string().min(1), coverAssetId: z.string().min(1).optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT") });

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "content.notes.read");
  if (access.response) return access.response;
  const notes = await prisma.note.findMany({ where: { deletedAt: null }, include: { gradeSubject: { include: { grade: true, subject: true, track: true } }, fileAsset: { select: { id: true, originalName: true, status: true, sizeBytes: true } } }, orderBy: { createdAt: "desc" } });
  return ok(notes.map((note) => ({ ...note, fileAsset: { ...note.fileAsset, sizeBytes: note.fileAsset.sizeBytes.toString() } })), request);
}

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "content.notes.create");
  if (access.response) return access.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات المذكرة غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const data = parsed.data;
  const note = await prisma.note.create({ data: { ...data, status: data.status as ContentStatus, createdById: access.user.id, publishedAt: data.status === "PUBLISHED" ? new Date() : null }, select: { id: true, title: true, status: true, createdAt: true } });
  return ok(note, request);
}
