import { compareSync, hashSync } from "bcryptjs";

const PASSWORD_SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hashSync(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compareSync(password, hash);
}
