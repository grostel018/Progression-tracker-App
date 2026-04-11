import { z } from "zod";

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(10).max(128);
export const usernameSchema = z.string().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/);
export const verificationCodeSchema = z.string().trim().min(6).max(64);
