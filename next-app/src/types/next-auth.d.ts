import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "USER" | "TESTER" | "ADMIN";
      username?: string | null;
    };
  }

  interface User {
    role?: "USER" | "TESTER" | "ADMIN";
    username?: string | null;
    status?: "ACTIVE" | "SUSPENDED" | "DELETED";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "TESTER" | "ADMIN";
    username?: string | null;
  }
}
