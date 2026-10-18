import type { UserRole } from "../users/user.types.js";

export type AuthUser = {
  id: number;
  username: string;
  roles: UserRole[];
};

export type RegisterInput = {
  username: string;
  password: string;
  roles: UserRole[];
};

export type LoginInput = {
  username: string;
  password: string;
};
