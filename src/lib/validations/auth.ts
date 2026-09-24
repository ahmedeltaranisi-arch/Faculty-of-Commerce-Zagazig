import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "الاسم يجب أن يحتوي على حرفين على الأقل").max(100),
  email: z.string().trim().toLowerCase().email("أدخل بريدًا إلكترونيًا صحيحًا").max(180),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف").max(128),
  confirmPassword: z.string().min(8),
  gradeCode: z.enum(["first", "second", "third", "fourth"]),
  trackCode: z.enum(["regular", "affiliate", "credit", "english"]),
}).superRefine((value, ctx) => {
  if (value.password !== value.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "تأكيد كلمة المرور غير مطابق" });
});
