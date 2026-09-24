export const fileRules = {
  book: { mimeTypes: ["application/pdf"], maxBytes: 100 * 1024 * 1024 },
  note: { mimeTypes: ["application/pdf"], maxBytes: 100 * 1024 * 1024 },
  image: { mimeTypes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 10 * 1024 * 1024 },
} as const;

export type UploadKind = keyof typeof fileRules;

export function safeFileName(input: string) {
  const base = input.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 90);
  return base || "file";
}
