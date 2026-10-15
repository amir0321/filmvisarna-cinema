import { Router } from "express";
import { query, Queryable } from "../utils/dbHelpers";

export const menuRouter = Router();

/** Menu rows; combos include what is inside them. `where` is a trusted SQL fragment. */
export function menuQuery(where: string) {
  return `
    SELECT mi.id, mi.name, mi.description, mi.category, mi.price,
           mi.is_combo AS "isCombo", mi.image_url AS "imageUrl",
           mi.is_available AS "isAvailable",
           CASE WHEN mi.is_combo THEN COALESCE((
             SELECT json_agg(json_build_object(
                      'menuItemId', part.id, 'name', part.name, 'quantity', ci.quantity)
                    ORDER BY part.name)
             FROM combo_item ci JOIN menu_item part ON part.id = ci.item_id
             WHERE ci.combo_id = mi.id), '[]'::json)
           END AS contents
    FROM menu_item mi
    WHERE ${where}
    ORDER BY mi.is_combo, mi.category, mi.name`;
}

export async function fetchMenuItem(db: Queryable, id: number) {
  const { rows } = await db.query(menuQuery("mi.id = $1"), [id]);
  return rows[0];
}

// GET /api/menu  (available food, drinks and combos)
menuRouter.get("/", async (_req, res) => {
  res.json(await query(menuQuery("mi.is_available")));
});
