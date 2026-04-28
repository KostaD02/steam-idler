export const UserRoleEnum = {
  Standard: 'standard',
  Admin: 'admin',
} as const;

export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];
