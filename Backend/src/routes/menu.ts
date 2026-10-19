import { Router } from "express";
import { query, Queryable, withTransaction } from "../utils/dbHelpers.js";
import { pool } from "../db.js";
import { HttpError, parseId } from "../utils/httpErorr.js";
import { requireAdmin, optionalAuth } from "../middleware/auth.js";
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

export const createMenuItemBody = z
  .object({
    name: z.string().trim().min(1, "Namn krävs").max(100),
    description: z.string().trim().max(500).optional().nullable(),
    category: z.enum(["food", "drink"]),
    price: z.number().min(0, "Pris kan inte vara negativt").max(10000),
    imageUrl: z.string().url("Ogiltig bild-URL").max(1000).optional().nullable(),
    isCombo: z.boolean().default(false),
    contents: z
      .array(
        z.object({
          menuItemId: z.number().int().positive("Ogiltigt artikel-ID"),
          quantity: z.number().int().min(1).max(20),
        }),
      )
      .default([]),
  })
  .refine(
    (b) => (b.isCombo ? b.contents.length > 0 : b.contents.length === 0),
    {
      message: "En meny (combo) måste innehålla artiklar, och en vanlig artikel kan inte innehålla artiklar",
      path: ["contents"],
    },
  );

export const updateMenuItemBody = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional().nullable(),
    category: z.enum(["food", "drink"]).optional(),
    price: z.number().min(0).max(10000).optional(),
    imageUrl: z.string().url().max(1000).optional().nullable(),
    isAvailable: z.boolean().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, {
    message: "Skicka minst ett fält att uppdatera",
  });

export async function createMenuItem(body: z.infer<typeof createMenuItemBody>) {
  try {
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
        await client.query(
          "INSERT INTO combo_item (combo_id, item_id, quantity) VALUES ($1, $2, $3)",
          [rows[0].id, part.menuItemId, part.quantity],
        );
      }
      return rows[0].id;
    });

    return await fetchMenuItem(pool, id);
  } catch (err: any) {
    if (err.code === "23505") {
      throw new HttpError(409, "En menyartikel med det namnet finns redan.");
    }
    if (err.code === "23503") {
      throw new HttpError(400, "En eller flera artiklar i menyn existerar inte.");
    }
    if (err.message && err.message.includes("combo")) {
      throw new HttpError(400, err.message);
    }
    throw err;
  }
}

export async function updateMenuItem(id: number, body: z.infer<typeof updateMenuItemBody>) {
  const existing = await fetchMenuItem(pool, id);
  if (!existing) {
    throw new HttpError(404, "Menyartikeln hittades inte.");
  }

  const updates: string[] = [];
  const values: unknown[] = [id];

  if (body.name !== undefined) {
    values.push(body.name);
    updates.push(`name = $${values.length}`);
  }
  if (body.description !== undefined) {
    values.push(body.description);
    updates.push(`description = $${values.length}`);
  }
  if (body.category !== undefined) {
    values.push(body.category);
    updates.push(`category = $${values.length}`);
  }
  if (body.price !== undefined) {
    values.push(body.price);
    updates.push(`price = $${values.length}`);
  }
  if (body.imageUrl !== undefined) {
    values.push(body.imageUrl);
    updates.push(`image_url = $${values.length}`);
  }
  if (body.isAvailable !== undefined) {
    values.push(body.isAvailable);
    updates.push(`is_available = $${values.length}`);
  }

  try {
    await pool.query(
      `UPDATE menu_item SET ${updates.join(", ")} WHERE id = $1`,
      values,
    );
    return await fetchMenuItem(pool, id);
  } catch (err: any) {
    if (err.code === "23505") {
      throw new HttpError(409, "En menyartikel med det namnet finns redan.");
    }
    throw err;
  }
}

// GET /api/menu (publik, stödjer ?all=true för admin)
menuRouter.get("/", optionalAuth, async (req, res) => {
  const includeAll = req.query.all === "true" && req.user?.role === "admin";
  const where = includeAll ? "1=1" : "mi.is_available = true";
  res.json(await query(menuQuery(where)));
});

// GET /api/menu/:id
menuRouter.get("/:id", optionalAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const item = await fetchMenuItem(pool, id);
  if (!item) throw new HttpError(404, "Menyartikeln hittades inte.");
  if (!item.isAvailable && req.user?.role !== "admin") {
    throw new HttpError(404, "Menyartikeln hittades inte.");
  }
  res.json(item);
});

// POST /api/menu (admin)
menuRouter.post("/", requireAdmin, async (req, res) => {
  const body = createMenuItemBody.parse(req.body);
  const item = await createMenuItem(body);
  res.status(201).json(item);
});

// POST /api/menu/menu-items (bakåtkompatibilitet)
menuRouter.post("/menu-items", requireAdmin, async (req, res) => {
  const body = createMenuItemBody.parse(req.body);
  const item = await createMenuItem(body);
  res.status(201).json(item);
});

// PATCH /api/menu/:id (admin)
menuRouter.patch("/:id", requireAdmin, async (req, res) => {
  const id = parseId(req.params.id);
  const body = updateMenuItemBody.parse(req.body);
  const item = await updateMenuItem(id, body);
  res.json(item);
});

// PATCH /api/menu/menu-items/:id (bakåtkompatibilitet)
menuRouter.patch("/menu-items/:id", requireAdmin, async (req, res) => {
  const id = parseId(req.params.id);
  const body = updateMenuItemBody.parse(req.body);
  const item = await updateMenuItem(id, body);
  res.json(item);
});
