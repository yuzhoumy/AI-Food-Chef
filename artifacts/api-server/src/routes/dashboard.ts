import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, favoritesTable, restaurantsTable, recommendationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatRestaurant(r: typeof restaurantsTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const [favsResult, historyResult] = await Promise.all([
    db.select().from(favoritesTable).where(eq(favoritesTable.userId, userId)),
    db.select().from(recommendationsTable).where(eq(recommendationsTable.userId, userId)).orderBy(desc(recommendationsTable.createdAt)).limit(10),
  ]);

  // Get all restaurant IDs needed
  const favRestaurantIds = favsResult.map(f => f.restaurantId);
  const histRestaurantIds = historyResult.map(h => h.restaurantId);
  const allIds = [...new Set([...favRestaurantIds, ...histRestaurantIds])];

  const restaurants = allIds.length > 0
    ? await db.select().from(restaurantsTable).then(all => all.filter(r => allIds.includes(r.id)))
    : [];
  const restaurantMap = new Map(restaurants.map(r => [r.id, r]));

  // Compute top cuisines from recommendations
  const cuisineCounts = new Map<string, number>();
  for (const h of historyResult) {
    const r = restaurantMap.get(h.restaurantId);
    if (r) {
      cuisineCounts.set(r.cuisine, (cuisineCounts.get(r.cuisine) ?? 0) + 1);
    }
  }
  const topCuisines = [...cuisineCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cuisine, count]) => ({ cuisine, count }));

  const recentRecommendations = historyResult.map(h => {
    const restaurant = restaurantMap.get(h.restaurantId);
    if (!restaurant) return null;
    return {
      id: h.id,
      restaurant: formatRestaurant(restaurant),
      mood: h.mood,
      matchReason: h.matchReason,
      createdAt: h.createdAt.toISOString(),
    };
  }).filter(Boolean);

  const favoriteRestaurants = favsResult
    .map(f => {
      const restaurant = restaurantMap.get(f.restaurantId);
      if (!restaurant) return null;
      return {
        id: f.id,
        restaurant: formatRestaurant(restaurant),
        createdAt: f.createdAt.toISOString(),
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  // Get total recommendations count
  const totalRecs = await db.select({ count: sql<number>`count(*)` }).from(recommendationsTable).where(eq(recommendationsTable.userId, userId)).then(r => Number(r[0]?.count ?? 0));

  res.json({
    totalFavorites: favsResult.length,
    totalRecommendations: totalRecs,
    topCuisines,
    recentRecommendations,
    favoriteRestaurants,
  });
});

export default router;
