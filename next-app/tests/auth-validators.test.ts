import { describe, expect, it } from "vitest";

import { resetPasswordSchema, signUpSchema, verifyEmailSchema } from "@/features/auth/validators";

describe("auth validators", () => {
  it("requires matching passwords during sign-up", () => {
    const result = signUpSchema.safeParse({
      email: "person@example.com",
      username: "builder_one",
      password: "correct-horse",
      confirmPassword: "wrong-horse"
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain("Passwords must match.");
    }
  });

  it("accepts sign-up when passwords match", () => {
    const result = signUpSchema.safeParse({
      email: "person@example.com",
      username: "builder_one",
      password: "correct-horse",
      confirmPassword: "correct-horse"
    });

    expect(result.success).toBe(true);
  });

  it("requires matching passwords during reset", () => {
    const result = resetPasswordSchema.safeParse({
      password: "correct-horse",
      confirmPassword: "wrong-horse"
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain("Passwords must match.");
    }
  });

  it("allows verification without a code", () => {
    const result = verifyEmailSchema.safeParse({
      email: "person@example.com"
    });

    expect(result.success).toBe(true);
  });
});
