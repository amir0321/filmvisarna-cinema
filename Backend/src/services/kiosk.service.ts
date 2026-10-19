import { query } from "../utils/dbHelpers.js";
import { HttpError } from "../utils/httpErorr.js";

import {
  MenuItemCategory,
  ComboItemPart,
  KioskItem,
  KioskItemFilters,
} from "../interfaces/types.js";
export type {
  MenuItemCategory,
  ComboItemPart,
  KioskItem,
  KioskItemFilters,
};

const KIOSK_SELECT = `
  SELECT
    mi.id,
    mi.name,
    mi.description,
    mi.category,
    mi.price,
    mi.is_combo,
    mi.image_url,
    mi.is_available,
    CASE
      WHEN mi.is_combo THEN
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', part.id,
                'name', part.name,
                'quantity', ci.quantity
              )
              ORDER BY part.name
            )
            FROM combo_item ci
            JOIN menu_item part ON part.id = ci.item_id
            WHERE ci.combo_id = mi.id
          ),
          '[]'::json
        )
      ELSE NULL
    END AS combo_items
  FROM menu_item mi
`;

export async function getActiveKioskItems(
  filters?: KioskItemFilters,
): Promise<KioskItem[]> {
  const conditions: string[] = ["mi.is_available = true"];
  const params: unknown[] = [];

  if (filters?.category) {
    params.push(filters.category);
    conditions.push(`mi.category = $${params.length}`);
  }

  if (filters?.isCombo !== undefined) {
    params.push(filters.isCombo);
    conditions.push(`mi.is_combo = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `${KIOSK_SELECT} ${whereClause} ORDER BY mi.is_combo DESC, mi.category ASC, mi.name ASC`;

  return query<KioskItem>(sql, params);
}

export async function getKioskItemById(id: number): Promise<KioskItem> {
  const sql = `${KIOSK_SELECT} WHERE mi.id = $1 AND mi.is_available = true`;
  const items = await query<KioskItem>(sql, [id]);

  if (!items[0]) {
    throw new HttpError(404, "Kiosk item not found");
  }

  return items[0];
}
