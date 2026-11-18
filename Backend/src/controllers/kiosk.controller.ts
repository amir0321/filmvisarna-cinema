import { Request, Response } from "express";
import {
  getActiveKioskItems,
  getKioskItemById,
  KioskItem,
  MenuItemCategory,
} from "../services/kiosk.service.js";
import { parseId } from "../utils/httpErorr.js";

import { ApiResponse } from "../interfaces/types.js";
export type { ApiResponse };

export async function getKiosk(
  req: Request,
  res: Response<ApiResponse<KioskItem[]>>,
): Promise<void> {
  const categoryParam = typeof req.query.category === "string" ? req.query.category.toLowerCase() : undefined;
  const isComboParam = typeof req.query.is_combo === "string" ? req.query.is_combo.toLowerCase() : undefined;

  const category =
    categoryParam === "food" || categoryParam === "drink"
      ? (categoryParam as MenuItemCategory)
      : undefined;

  const isCombo =
    isComboParam === "true"
      ? true
      : isComboParam === "false"
        ? false
        : undefined;

  const items = await getActiveKioskItems({ category, isCombo });

  res.status(200).json({
    success: true,
    data: items,
  });
}

export async function getKioskItem(
  req: Request,
  res: Response<ApiResponse<KioskItem>>,
): Promise<void> {
  const id = parseId(req.params.id, "kioskartikel-ID");
  const item = await getKioskItemById(id);

  res.status(200).json({
    success: true,
    data: item,
  });
}
