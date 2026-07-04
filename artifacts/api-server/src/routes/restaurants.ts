import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, restaurantsTable } from "@workspace/db";
import { ListRestaurantsQueryParams, GetRestaurantParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatRestaurant(r: typeof restaurantsTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/restaurants/featured", async (_req, res): Promise<void> => {
  const restaurants = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.isFeatured, true))
    .limit(10);

  res.json(restaurants.map(formatRestaurant));
});

router.get("/restaurants", async (req, res): Promise<void> => {
  const params = ListRestaurantsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { cuisine, budget, atmosphere, openNow, limit } = params.data;

  const conditions = [];
  if (cuisine) conditions.push(eq(restaurantsTable.cuisine, cuisine));
  if (budget) conditions.push(eq(restaurantsTable.budgetRange, budget));
  if (openNow !== undefined) conditions.push(eq(restaurantsTable.isOpenNow, openNow));

  let query = db.select().from(restaurantsTable);
  if (conditions.length > 0) {
    // @ts-ignore
    query = query.where(and(...conditions));
  }

  const restaurants = await query.limit(limit ?? 20);

  // Filter by atmosphere if provided (array contains)
  const filtered = atmosphere
    ? restaurants.filter(r => r.atmosphere.includes(atmosphere))
    : restaurants;

  res.json(filtered.map(formatRestaurant));
});

router.get("/restaurants/:id", async (req, res): Promise<void> => {
  const params = GetRestaurantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const restaurant = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, params.data.id)).then(r => r[0]);

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  res.json(formatRestaurant(restaurant));
});

export default router;
