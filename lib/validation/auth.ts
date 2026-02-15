import { z } from "zod";
import { isSupportedSocialProvider } from "@/lib/auth";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "יש להזין אימייל")
    .email("יש להזין כתובת אימייל תקינה"),
  password: z.string().min(1, "יש להזין סיסמה")
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "יש להזין אימייל")
      .email("יש להזין כתובת אימייל תקינה"),
    password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים"),
    confirmPassword: z.string().min(1, "יש לאשר את הסיסמה")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirmPassword"]
  });

export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "יש להזין קוד אימות בן 6 ספרות")
});

export const socialLoginSchema = z.object({
  provider: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isSupportedSocialProvider, "יש לבחור ספק התחברות נתמך")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;
