import { z } from "zod";

export const nonEmptyStringSchema = z.string().trim().min(1);
export const cuidSchema = z.string().min(10);
