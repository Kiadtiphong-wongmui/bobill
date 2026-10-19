import { Router } from "express";

import { quotationController } from "./quotation.controller.js";

export const quotationRoutes = Router();

quotationRoutes.get("/recent", quotationController.recent);
quotationRoutes.get("/stats", quotationController.stats);
quotationRoutes.get("/", quotationController.list);
quotationRoutes.get("/:id", quotationController.getById);
quotationRoutes.post("/", quotationController.create);
quotationRoutes.put("/:id", quotationController.update);
quotationRoutes.patch("/:id/send", quotationController.send);
quotationRoutes.patch("/:id/accept", quotationController.accept);
quotationRoutes.patch("/:id/reject", quotationController.reject);
quotationRoutes.post("/:id/convert-to-invoice", quotationController.convertToInvoice);
quotationRoutes.delete("/:id", quotationController.remove);
quotationRoutes.get("/:id/export-pdf", quotationController.exportPdf);
