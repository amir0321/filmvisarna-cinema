import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  deleteScreeningHandler,
  getScreenings,
  getSeats,
  getTodayScreenings,
  getDashboardScreenings,
  postScreening,
  putScreening,
} from "../controllers/screenings.controller.js";

export const screeningsRouter = Router();

screeningsRouter.get("/", getScreenings);
screeningsRouter.get("/today", getTodayScreenings);
screeningsRouter.get("/dashboard", requireAdmin, getDashboardScreenings);
screeningsRouter.get("/:id/seats", getSeats);
screeningsRouter.post("/", requireAdmin, postScreening);
screeningsRouter.put("/:id", requireAdmin, putScreening);
screeningsRouter.delete("/:id", requireAdmin, deleteScreeningHandler);
