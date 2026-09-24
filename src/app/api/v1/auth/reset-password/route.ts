import argon2 from "argon2";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";

const schema = z.object({ token: z.string().min(20), password: z.string().min(8).max(128), confirmPassword: z.string().min(8) }).superRefine((value, ctx) => { if (value.password !== value.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "تأكيد كلمة المرور غير مطابق" }); });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "بيانات كلمة المرور غير صحيحة.", request, 422, parsed.error.flatten().fieldErrors);
  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const resetToken = await prisma.passwordResetToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } } });
  if (!resetToken) return fail("INVALID_RESET_TOKEN", "رابط إعادة التعيين غير صالح أو منتهي.", request, 400);
  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
  await prisma.$transaction([
    prisma.user.update({ where: { normalizedEmail: resetToken.email }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { user: { normalizedEmail: resetToken.email } } }),
  ]);
  return ok({ message: "تم تغيير كلمة المرور بنجاح." }, request);
}
