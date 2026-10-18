import { Router } from "express";

import { userController } from "./user.controller.js";

export const userRoutes = Router();

userRoutes.get("/", userController.listUsers);
userRoutes.get("/:id", userController.getUserById);
userRoutes.post("/", userController.createUser);
userRoutes.put("/:id", userController.updateUser);
userRoutes.delete("/:id", userController.deleteUser);
