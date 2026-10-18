import { Router } from "express";

import { invoiceController } from "./invoice.controller.js";

export const invoiceRoutes = Router();

invoiceRoutes.get("/recent", invoiceController.recent);
invoiceRoutes.get("/stats", invoiceController.stats);
invoiceRoutes.get("/", invoiceController.list);
invoiceRoutes.get("/:id", invoiceController.getById);
invoiceRoutes.post("/", invoiceController.create);
invoiceRoutes.put("/:id", invoiceController.update);
invoiceRoutes.patch("/:id/issue", invoiceController.issue);
invoiceRoutes.delete("/:id", invoiceController.cancel);
invoiceRoutes.get("/:id/export-pdf", invoiceController.exportPdf);
