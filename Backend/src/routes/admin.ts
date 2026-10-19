import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getAdminStats } from "../services/admin.service.js";

export const adminRouter = Router();

adminRouter.get("/stats", requireAdmin, async (_req: Request, res: Response) => {
  const stats = await getAdminStats();
  res.json({ success: true, data: stats });
});
