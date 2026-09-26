import argon2 from "argon2";
import { UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { fail, ok } from "@/lib/api-response";
import { registerSchema } from "@/lib/validations/auth";
import { createOpaqueToken, sendVerificationEmail } from "@/server/email/service";
import { requiresEmailVerification } from "@/server/auth/settings";

const gradeByCode = { first: "FIRST", second: "SECOND", third: "THIRD", fourth: "FOURTH" } as const;
const trackByCode = { regular: "REGULAR", affiliate: "AFFILIATE", credit: "CREDIT", english: "ENGLISH" } as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "راجع البيانات المدخلة.", request, 422, parsed.error.flatten().fieldErrors);
    const email = parsed.data.email;
    const exists = await prisma.user.findUnique({ where: { normalizedEmail: email } });
    if (exists) return fail("EMAIL_EXISTS", "لا يمكن إنشاء حساب بهذا البريد.", request, 409);
    const [grade, track, studentRole] = await Promise.all([
      prisma.grade.findUnique({ where: { code: gradeByCode[parsed.data.gradeCode] } }),
      prisma.track.findUnique({ where: { code: trackByCode[parsed.data.trackCode] } }),
      prisma.role.findUnique({ where: { name: "STUDENT" } }),
    ]);
    if (!grade || !track || !studentRole) return fail("CONFIGURATION_ERROR", "إعدادات التسجيل غير مكتملة.", request, 503);
    const requireEmailVerification = requiresEmailVerification();
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    const verification = requireEmailVerification ? createOpaqueToken() : null;
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { name: parsed.data.name, email, normalizedEmail: email, passwordHash, status: requireEmailVerification ? UserStatus.PENDING_VERIFICATION : UserStatus.ACTIVE, roles: { create: { roleId: studentRole.id } }, enrollments: { create: { gradeId: grade.id, trackId: track.id } } }, select: { id: true, name: true, email: true, status: true } });
      if (verification) await tx.emailVerificationToken.create({ data: { userId: created.id, tokenHash: verification.tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      return created;
    });
    if (verification) {
      try { await sendVerificationEmail(user.email, user.name, verification.rawToken); } catch (emailError) { console.error("verification_email_error", emailError); }
    }
    return ok({ user, message: requireEmailVerification ? "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتفعيل الحساب." : "تم إنشاء الحساب ويمكنك تسجيل الدخول الآن." }, request);
  } catch (error) {
    console.error("register_error", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "تعذر إنشاء الحساب حاليًا." } }, { status: 500 });
  }
}
