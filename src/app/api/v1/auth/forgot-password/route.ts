import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { createOpaqueToken, sendPasswordResetEmail } from "@/server/email/service";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "أدخل بريدًا إلكترونيًا صحيحًا.", request, 422);
  const generic = { message: "إذا كان البريد مسجلًا، ستصلك رسالة لإعادة تعيين كلمة المرور." };
  const user = await prisma.user.findUnique({ where: { normalizedEmail: parsed.data.email }, select: { id: true, name: true, email: true, status: true } });
  if (!user || user.status === "DELETED") return ok(generic, request);
  const { rawToken, tokenHash } = createOpaqueToken();
  await prisma.passwordResetToken.deleteMany({ where: { email: user.email, usedAt: null } });
  await prisma.passwordResetToken.create({ data: { email: user.email, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  try { await sendPasswordResetEmail(user.email, user.name, rawToken); } catch (error) { console.error("password_reset_email_error", error); }
  return ok(generic, request);
}
