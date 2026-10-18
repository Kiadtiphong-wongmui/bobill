import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import multer from "multer";

const uploadRootDir = path.resolve(process.cwd(), "src", "upload");
fs.mkdirSync(uploadRootDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRootDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : ".png";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `signature-${unique}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("รองรับเฉพาะไฟล์รูปภาพ"));
      return;
    }
    cb(null, true);
  },
});

export const uploadRoutes = Router();
export const uploadPublicDir = uploadRootDir;

uploadRoutes.post("/signature", (req, res) => {
  upload.single("file")(req, res, (error?: unknown) => {
    if (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "อัปโหลดไฟล์ไม่สำเร็จ",
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "ไม่พบไฟล์ที่อัปโหลด" });
    }

    return res.status(201).json({
      path: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
});
