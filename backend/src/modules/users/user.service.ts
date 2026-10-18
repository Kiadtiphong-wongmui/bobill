import { prisma } from "../../config/prisma.js";
import { hashPassword } from "../auth/auth.password.js";
import { ALLOWED_ROLES } from "./user.types.js";
import type { CreateUserInput, PublicUser, UpdateUserInput, UserRole } from "./user.types.js";

const validateRoles = (roles: string[]): void => {
  const hasInvalidRole = roles.some((role) => !ALLOWED_ROLES.includes(role as UserRole));
  if (hasInvalidRole) {
    throw new Error(`roles must only contain: ${ALLOWED_ROLES.join(", ")}`);
  }
};

export const userService = {
  async listUsers(): Promise<PublicUser[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async getUserById(id: number): Promise<PublicUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    validateRoles(input.roles);
    const passwordHash = await hashPassword(input.password);

    return prisma.user.create({
      data: {
        username: input.username,
        password: passwordHash,
        roles: input.roles,
      },
      select: {
        id: true,
        username: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateUser(id: number, input: UpdateUserInput): Promise<PublicUser> {
    if (input.roles) {
      validateRoles(input.roles);
    }

    const data: UpdateUserInput = {};
    if (input.username !== undefined) data.username = input.username;
    if (input.password !== undefined) data.password = await hashPassword(input.password);
    if (input.roles !== undefined) data.roles = input.roles;

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async deleteUser(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  },
};
