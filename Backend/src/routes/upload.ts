import { Router, Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { HttpError } from "../utils/httpErorr.js";
import { requireAdmin } from "../middleware/auth.js";

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, "Endast bildfiler (JPEG, PNG, WebP, GIF, SVG) är tillåtna."));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  "/",
  requireAdmin,
  upload.single("image"),
  (req: Request, res: Response) => {
    if (!req.file) {
      throw new HttpError(400, "Ingen bildfil skickades. Använd fältet 'image'.");
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      success: true,
      message: "Bilden har laddats upp.",
      url: fileUrl,
      filename: req.file.filename,
    });
  },
);
