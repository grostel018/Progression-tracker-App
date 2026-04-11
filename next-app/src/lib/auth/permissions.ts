import type { UserRole } from "./roles";

const roleRank: Record<UserRole, number> = {
  USER: 1,
  TESTER: 2,
  ADMIN: 3
};

export function hasRequiredRole(currentRole: UserRole, requiredRole: UserRole): boolean {
  return roleRank[currentRole] >= roleRank[requiredRole];
}
