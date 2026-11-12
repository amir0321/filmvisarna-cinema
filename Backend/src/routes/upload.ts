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
    const extensions: Record<string, string[]> = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    };
    const ext = path.extname(file.originalname).toLowerCase();
    if (extensions[file.mimetype]?.includes(ext)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, "Endast bildfiler (JPEG, PNG, WebP, GIF) med matchande MIME-typ och filändelse är tillåtna."));
    }
  },
});

const imageSignatures: Record<string, Buffer[]> = {
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png": [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "image/gif": [Buffer.from("GIF87a"), Buffer.from("GIF89a")],
};

async function hasMatchingImageContent(file: Express.Multer.File): Promise<boolean> {
  const handle = await fs.promises.open(file.path, "r");
  const buffer = Buffer.alloc(12);
  try {
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const header = buffer.subarray(0, bytesRead);
    if (file.mimetype === "image/webp") {
      return header.length === 12
        && header.subarray(0, 4).equals(Buffer.from("RIFF"))
        && header.subarray(8, 12).equals(Buffer.from("WEBP"));
    }
    return imageSignatures[file.mimetype]?.some((signature) =>
      header.subarray(0, signature.length).equals(signature),
    ) ?? false;
  } finally {
    await handle.close();
  }
}

export const uploadRouter = Router();

uploadRouter.post(
  "/",
  requireAdmin,
  upload.single("image"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new HttpError(400, "Ingen bildfil skickades. Använd fältet 'image'.");
    }

    if (!await hasMatchingImageContent(req.file)) {
      await fs.promises.unlink(req.file.path);
      throw new HttpError(400, "Filens innehåll matchar inte ett giltigt bildformat (JPEG, PNG, WebP, GIF).");
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
