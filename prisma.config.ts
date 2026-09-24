import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Support both the app's DATABASE_URL and Vercel Postgres integration variables.
    url:
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/commerce_zagazig",
  },
});

