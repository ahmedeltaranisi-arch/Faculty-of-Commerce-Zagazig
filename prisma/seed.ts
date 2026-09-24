import { prisma } from "../src/server/db/prisma";

const gradeSeed = [
  ["FIRST", "الفرقة الأولى", 1],
  ["SECOND", "الفرقة الثانية", 2],
  ["THIRD", "الفرقة الثالثة", 3],
  ["FOURTH", "الفرقة الرابعة", 4],
] as const;

const trackSeed = [
  ["REGULAR", "انتظام"],
  ["AFFILIATE", "انتساب"],
  ["CREDIT", "كريديت"],
  ["ENGLISH", "إنجليزي"],
] as const;

const permissions = [
  "content.books.read", "content.books.create", "content.books.update", "content.books.delete",
  "content.notes.read", "content.notes.create", "content.notes.update", "content.notes.delete",
  "content.videos.read", "content.videos.create", "content.videos.update", "content.videos.delete",
  "content.links.read", "content.links.create", "content.links.update", "content.links.delete",
  "exams.read", "exams.create", "exams.update", "exams.delete", "exams.publish", "results.read",
  "users.read", "users.update", "roles.manage", "audit.read", "academic.manage",
];

const rolePermissions: Record<string, string[]> = {
  STUDENT: permissions.filter((permission) => permission.endsWith(".read")),
  CONTENT_EDITOR: permissions.filter((permission) => permission.startsWith("content.")),
  EXAM_MANAGER: permissions.filter((permission) => permission.startsWith("exams.") || permission === "results.read"),
  USER_MANAGER: permissions.filter((permission) => permission.startsWith("users.") || permission === "roles.manage"),
  SUPER_ADMIN: permissions,
};

async function main() {
  for (const [code, name, sortOrder] of gradeSeed) await prisma.grade.upsert({ where: { code }, update: { name, sortOrder }, create: { code, name, sortOrder } });
  for (const [code, name] of trackSeed) await prisma.track.upsert({ where: { code }, update: { name }, create: { code, name } });

  for (const code of permissions) await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  for (const [name, codes] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `${name} role` } });
    for (const permissionCode of codes) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code: permissionCode } });
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } }, update: {}, create: { roleId: role.id, permissionId: permission.id } });
    }
  }

  const subjects = [
    ["المحاسبة المالية", "financial-accounting"],
    ["إدارة الأعمال", "business-management"],
    ["مبادئ الاقتصاد", "principles-of-economics"],
    ["الإحصاء", "statistics"],
  ] as const;
  for (const [name, slug] of subjects) await prisma.subject.upsert({ where: { slug }, update: { name }, create: { name, slug } });

  console.log("Seed complete: grades, tracks, roles, permissions and starter subjects.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
