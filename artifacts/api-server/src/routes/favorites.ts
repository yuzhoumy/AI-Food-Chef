import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, favoritesTable, restaurantsTable } from "@workspace/db";
import { AddFavoriteBody, RemoveFavoriteParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatRestaurant(r: typeof restaurantsTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

router.get("/favorites", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const favs = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId))
    .orderBy(desc(favoritesTable.createdAt));

  const restaurantIds = favs.map(f => f.restaurantId);
  const restaurants = restaurantIds.length > 0
    ? await db.select().from(restaurantsTable).then(all => all.filter(r => restaurantIds.includes(r.id)))
    : [];
  const restaurantMap = new Map(restaurants.map(r => [r.id, r]));

  const result = favs
    .map(f => {
      const restaurant = restaurantMap.get(f.restaurantId);
      if (!restaurant) return null;
      return {
        id: f.id,
        restaurant: formatRestaurant(restaurant),
        createdAt: f.createdAt.toISOString(),
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  res.json(result);
});

router.post("/favorites", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const restaurant = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, parsed.data.restaurantId)).then(r => r[0]);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const existing = await db.select().from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.restaurantId, parsed.data.restaurantId)))
    .then(r => r[0]);

  if (existing) {
    res.status(400).json({ error: "Already in favorites" });
    return;
  }

  const [fav] = await db.insert(favoritesTable).values({ userId, restaurantId: parsed.data.restaurantId }).returning();

  res.status(201).json({
    id: fav.id,
    restaurant: formatRestaurant(restaurant),
    createdAt: fav.createdAt.toISOString(),
  });
});

router.delete("/favorites/:restaurantId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.restaurantId, params.data.restaurantId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Favorite not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
