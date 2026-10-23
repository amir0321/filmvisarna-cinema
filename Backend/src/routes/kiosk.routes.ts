import { Router } from "express";
import { getKiosk, getKioskItem } from "../controllers/kiosk.controller.js";

export const kioskRouter = Router();

kioskRouter.get("/", getKiosk);

kioskRouter.get("/:id", getKioskItem);
