import { Router } from "express";
import { employeeCardController } from "./employee-card.controller.js";

export const employeeCardRoutes = Router();

employeeCardRoutes.get("/", employeeCardController.list);
employeeCardRoutes.post("/", employeeCardController.create);
employeeCardRoutes.get("/:id", employeeCardController.getById);
employeeCardRoutes.put("/:id", employeeCardController.update);
employeeCardRoutes.delete("/:id", employeeCardController.delete);
employeeCardRoutes.get("/:id/export-pdf", employeeCardController.exportPdf);
