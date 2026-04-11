import { emailSchema, passwordSchema, usernameSchema, verificationCodeSchema } from "@/lib/validation/auth";
import { z } from "zod";

export const signUpSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema.optional(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password.")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: verificationCodeSchema.optional()
});
