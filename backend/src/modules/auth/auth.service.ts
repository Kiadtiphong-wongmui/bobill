import { prisma } from "../../config/prisma.js";
import { hashPassword, verifyPassword } from "./auth.password.js";
import type { AuthUser, LoginInput, RegisterInput } from "./auth.types.js";

const toAuthUser = (user: { id: number; username: string; roles: ("ADMIN" | "USER")[] }): AuthUser => {
  return {
    id: user.id,
    username: user.username,
    roles: user.roles,
  };
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthUser> {
    const existing = await prisma.user.findUnique({
      where: { username: input.username },
      select: { id: true },
    });
    if (existing) {
      throw new Error("มีชื่อผู้ใช้นี้ในระบบแล้ว");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        password: passwordHash,
        roles: input.roles,
      },
      select: {
        id: true,
        username: true,
        roles: true,
      },
    });

    return toAuthUser(user);
  },

  async login(input: LoginInput): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { username: input.username },
      select: {
        id: true,
        username: true,
        password: true,
        roles: true,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await verifyPassword(input.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.password.startsWith("$2")) {
      const passwordHash = await hashPassword(input.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      });
    }

    return toAuthUser(user);
  },
};
