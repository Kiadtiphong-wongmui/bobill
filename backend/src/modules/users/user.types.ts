export const ALLOWED_ROLES = ["ADMIN", "USER"] as const;

export type UserRole = (typeof ALLOWED_ROLES)[number];

export type CreateUserInput = {
  username: string;
  password: string;
  roles: UserRole[];
};

export type UpdateUserInput = Partial<CreateUserInput>;

export type PublicUser = {
  id: number;
  username: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
};
