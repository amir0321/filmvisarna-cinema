import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  deleteCinemaHandler,
  getCinema,
  getCinemas,
  postCinema,
  putCinema,
} from "../controllers/cinemas.controller.js";

export const cinemasRouter = Router();

cinemasRouter.get("/", getCinemas);

cinemasRouter.get("/:id", getCinema);

cinemasRouter.post("/", requireAdmin, postCinema);

cinemasRouter.put("/:id", requireAdmin, putCinema);

cinemasRouter.delete("/:id", requireAdmin, deleteCinemaHandler);
