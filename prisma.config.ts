import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Generate Client during Vercel build even before a real database is attached.
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/commerce_zagazig",
  },
});
