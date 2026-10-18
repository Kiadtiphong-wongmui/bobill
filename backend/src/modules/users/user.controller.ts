import type { Request, Response } from "express";

import { userService } from "./user.service.js";
import { ALLOWED_ROLES } from "./user.types.js";
import type { CreateUserInput, UpdateUserInput, UserRole } from "./user.types.js";

const parseRoles = (roles: unknown): UserRole[] => {
  if (!Array.isArray(roles)) {
    throw new Error("roles must be an array");
  }

  const hasInvalidRole = roles.some((role) => !ALLOWED_ROLES.includes(role as UserRole));
  if (hasInvalidRole) {
    throw new Error(`roles must only contain: ${ALLOWED_ROLES.join(", ")}`);
  }

  return roles as UserRole[];
};

const parseUserId = (rawId: string | string[] | undefined): number => {
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) {
    throw new Error("id is required");
  }

  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("id must be a positive integer");
  }

  return parsedId;
};

const parseCreatePayload = (req: Request): CreateUserInput => {
  const { username, password, roles } = req.body as {
    username?: string;
    password?: string;
    roles?: unknown;
  };

  if (!username || !password) {
    throw new Error("username and password are required");
  }

  return { username, password, roles: parseRoles(roles) };
};

const parseUpdatePayload = (req: Request): UpdateUserInput => {
  const { username, password, roles } = req.body as {
    username?: string;
    password?: string;
    roles?: unknown;
  };

  const data: UpdateUserInput = {};
  if (username !== undefined) data.username = username;
  if (password !== undefined) data.password = password;
  if (roles !== undefined) data.roles = parseRoles(roles);

  return data;
};

export const userController = {
  async listUsers(_req: Request, res: Response) {
    const users = await userService.listUsers();
    return res.status(200).json(users);
  },

  async getUserById(req: Request, res: Response) {
    let id: number;
    try {
      id = parseUserId(req.params.id);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Invalid user id",
      });
    }
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  },

  async createUser(req: Request, res: Response) {
    try {
      const payload = parseCreatePayload(req);
      const user = await userService.createUser(payload);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Unable to create user",
      });
    }
  },

  async updateUser(req: Request, res: Response) {
    let id: number;
    try {
      id = parseUserId(req.params.id);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Invalid user id",
      });
    }

    try {
      const payload = parseUpdatePayload(req);
      const user = await userService.updateUser(id, payload);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Unable to update user",
      });
    }
  },

  async deleteUser(req: Request, res: Response) {
    let id: number;
    try {
      id = parseUserId(req.params.id);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Invalid user id",
      });
    }

    try {
      await userService.deleteUser(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Unable to delete user",
      });
    }
  },
};
