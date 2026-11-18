import { Router } from "express";
import { query } from "../utils/dbHelpers.js";
import { PriceGroup } from "../interfaces/types.js";

export const priceGroupsRouter = Router();

priceGroupsRouter.get("/", async (_req, res) => {
  const priceGroups = await query<PriceGroup>(
    "SELECT id, name, price::float FROM price_group ORDER BY id ASC",
  );
  res.json({ success: true, data: priceGroups });
});
