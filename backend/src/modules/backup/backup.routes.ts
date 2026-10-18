import { Router } from "express";
import { backupController } from "./backup.controller.js";

export const backupRoutes = Router();

backupRoutes.post("/snapshot", backupController.snapshot);
backupRoutes.get("/snapshots", backupController.listSnapshots);
backupRoutes.get("/snapshots/:filename/download", backupController.downloadSnapshot);
backupRoutes.delete("/snapshots/:filename", backupController.deleteSnapshot);
backupRoutes.post("/restore/:filename", backupController.restoreSnapshot);
backupRoutes.post("/restore/upload", backupController.restoreUpload);
backupRoutes.post("/clean", backupController.clean);
backupRoutes.get("/stats", backupController.stats);
