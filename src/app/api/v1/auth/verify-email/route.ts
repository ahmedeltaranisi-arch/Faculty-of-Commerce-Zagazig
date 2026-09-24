import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawToken = url.searchParams.get("token") ?? "";
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const token = await prisma.emailVerificationToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } }, include: { user: true } });
  const destination = new URL("/login", url.origin);
  if (!token) { destination.searchParams.set("verified", "error"); return NextResponse.redirect(destination); }
  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { status: "ACTIVE", emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
  ]);
  destination.searchParams.set("verified", "success");
  return NextResponse.redirect(destination);
}
