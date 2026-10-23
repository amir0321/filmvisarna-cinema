import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getAdminStats } from "../services/admin.service.js";
import {
  createMenuItem,
  createMenuItemBody,
  menuQuery,
  updateMenuItem,
  updateMenuItemBody,
} from "./menu.js";
import { query } from "../utils/dbHelpers.js";
import { parseId } from "../utils/httpErorr.js";

export const adminRouter = Router();

adminRouter.get("/stats", requireAdmin, async (_req: Request, res: Response) => {
  const stats = await getAdminStats();
  res.json({ success: true, data: stats });
});

// GET /api/admin/menu-items
adminRouter.get("/menu-items", requireAdmin, async (_req: Request, res: Response) => {
  const items = await query(menuQuery("1=1"));
  res.json({ success: true, data: items });
});

// POST /api/admin/menu-items
adminRouter.post("/menu-items", requireAdmin, async (req: Request, res: Response) => {
  const body = createMenuItemBody.parse(req.body);
  const item = await createMenuItem(body);
  res.status(201).json({ success: true, data: item });
});

// PATCH /api/admin/menu-items/:id
adminRouter.patch("/menu-items/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const body = updateMenuItemBody.parse(req.body);
  const item = await updateMenuItem(id, body);
  res.json({ success: true, data: item });
});
