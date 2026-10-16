import { Router } from "express";
import { query, Queryable, withTransaction } from "../utils/dbHelpers";
import { pool } from "../db";
import { HttpError, parseId } from "../utils/httpErorr";
import z from "zod";

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

const createMenuItemBody = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    category: z.enum(["food", "drink"]),
    price: z.number().min(0).max(10000),
    imageUrl: z.string().url().max(1000).optional(),
    isCombo: z.boolean().default(false),
    contents: z
      .array(
        z.object({
          menuItemId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(20),
        }),
      )
      .default([]),
  })
  .refine(
    (b) => (b.isCombo ? b.contents.length > 0 : b.contents.length === 0),
    {
      message: "A combo needs contents, and a normal item must not have any",
      path: ["contents"],
    },
  );

// POST /api/admin/menu-items   (a normal item, or a combo with contents)
menuRouter.post("/menu-items", async (req, res) => {
  const body = createMenuItemBody.parse(req.body);

  const id = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO menu_item (name, description, category, price, is_combo, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        body.name,
        body.description ?? null,
        body.category,
        body.price,
        body.isCombo,
        body.imageUrl ?? null,
      ],
    );
    for (const part of body.contents) {
      // The database trigger rejects nested combos and non-combo parents
      await client.query(
        "INSERT INTO combo_item (combo_id, item_id, quantity) VALUES ($1, $2, $3)",
        [rows[0].id, part.menuItemId, part.quantity],
      );
    }
    return rows[0].id;
  });

  res.status(201).json(await fetchMenuItem(pool, id));
});

const updateMenuItemBody = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    price: z.number().min(0).max(10000).optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, {
    message: "Send at least one field to update",
  });

// PATCH /api/admin/menu-items/:id   (change price, name or hide a sold-out item)
menuRouter.patch("/menu-items/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const body = updateMenuItemBody.parse(req.body);

  const { rowCount } = await pool.query(
    `UPDATE menu_item SET
       name         = COALESCE($2, name),
       description  = COALESCE($3, description),
       price        = COALESCE($4, price),
       is_available = COALESCE($5, is_available)
     WHERE id = $1`,
    [
      id,
      body.name ?? null,
      body.description ?? null,
      body.price ?? null,
      body.isAvailable ?? null,
    ],
  );
  if (rowCount === 0) throw new HttpError(404, "Menu item not found");

  res.json(await fetchMenuItem(pool, id));
});
