import express from "express";
import type { Request, Response } from "express";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { requireAuth } from "./modules/auth/auth.middleware.js";
import { invoiceRoutes } from "./modules/invoices/invoice.routes.js";
import { quotationRoutes } from "./modules/quotations/quotation.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { uploadRoutes, uploadPublicDir } from "./modules/uploads/upload.routes.js";
import { employeeCardRoutes } from "./modules/employee-cards/employee-card.routes.js";
import { backupRoutes } from "./modules/backup/backup.routes.js";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World Backend");
});

// Public routes — no authentication required
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static(uploadPublicDir));

// Protected routes — require valid session token via Authorization: Bearer <token>
app.use("/api/users", requireAuth, userRoutes);
app.use("/api/invoices", requireAuth, invoiceRoutes);
app.use("/api/quotations", requireAuth, quotationRoutes);
app.use("/api/uploads", requireAuth, uploadRoutes);
app.use("/api/employee-cards", requireAuth, employeeCardRoutes);
app.use("/api/backup", requireAuth, backupRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
