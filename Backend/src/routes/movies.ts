import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  deleteMovieHandler,
  getMovie,
  getMovies,
  postMovie,
  putMovie,
} from "../controllers/movies.controller.js";

export const moviesRouter = Router();

moviesRouter.get("/", getMovies);
moviesRouter.get("/:id", getMovie);
moviesRouter.post("/", requireAdmin, postMovie);
moviesRouter.put("/:id", requireAdmin, putMovie);
moviesRouter.delete("/:id", requireAdmin, deleteMovieHandler);
