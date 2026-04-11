export const USER_ROLES = {
  USER: "USER",
  TESTER: "TESTER",
  ADMIN: "ADMIN"
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export function isUserRole(value: string | null | undefined): value is UserRole {
  return value === USER_ROLES.USER || value === USER_ROLES.TESTER || value === USER_ROLES.ADMIN;
}
