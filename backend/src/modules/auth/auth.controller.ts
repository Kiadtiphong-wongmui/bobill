import type { Request, Response } from "express";

import { ALLOWED_ROLES } from "../users/user.types.js";
import type { UserRole } from "../users/user.types.js";
import { authService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";

const parseCredentials = (body: unknown): LoginInput => {
  const payload = body as { username?: unknown; password?: unknown };
  const username = typeof payload.username === "string" ? payload.username.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (username.length < 3 || password.length < 8) {
    throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }

  return { username, password };
};

const parseRegisterInput = (body: unknown): RegisterInput => {
  const credentials = parseCredentials(body);
  const payload = body as { roles?: unknown };
  const rolesRaw = payload.roles;

  if (rolesRaw === undefined) {
    return { ...credentials, roles: ["USER"] };
  }

  if (!Array.isArray(rolesRaw)) {
    throw new Error("roles ต้องเป็น array");
  }

  const hasInvalidRole = rolesRaw.some((role) => !ALLOWED_ROLES.includes(role as UserRole));
  if (hasInvalidRole || rolesRaw.length === 0) {
    throw new Error(`roles ต้องเป็นค่าใดค่าหนึ่งใน: ${ALLOWED_ROLES.join(", ")}`);
  }

  return { ...credentials, roles: rolesRaw as UserRole[] };
};

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const payload = parseRegisterInput(req.body);
      const user = await authService.register(payload);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "ไม่สามารถสมัครสมาชิกได้",
      });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const payload = parseCredentials(req.body);
      const user = await authService.login(payload);
      if (!user) {
        return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }

      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "ไม่สามารถเข้าสู่ระบบได้",
      });
    }
  },
};
