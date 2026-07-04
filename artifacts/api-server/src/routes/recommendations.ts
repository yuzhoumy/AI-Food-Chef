import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, restaurantsTable, recommendationsTable, preferencesTable } from "@workspace/db";
import { GetRecommendationBody, ShuffleRecommendationBody, GetRecommendationHistoryQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { getAIRecommendation } from "../lib/ai";

const router: IRouter = Router();

function formatRestaurant(r: typeof restaurantsTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

async function makeRecommendation(userId: string, body: { mood: string; budget?: string | null; distance?: number | null; cuisine?: string | null; atmosphere?: string | null; diningPreference?: string | null; excludeRestaurantIds?: number[] }) {
  // Get user preferences
  const userPrefs = await db.select().from(preferencesTable).where(eq(preferencesTable.userId, userId)).then(r => r[0]);

  // Get candidate restaurants
  const allRestaurants = await db.select().from(restaurantsTable).where(eq(restaurantsTable.isOpenNow, true)).limit(50);

  // Apply hard filters based on user preferences
  let candidates = allRestaurants;
  if (userPrefs?.isHalal === true) candidates = candidates.filter(r => r.isHalal);
  if (userPrefs?.isVegetarian === true) candidates = candidates.filter(r => r.isVegetarianFriendly);
  if (body.cuisine) candidates = candidates.filter(r => r.cuisine.toLowerCase() === body.cuisine!.toLowerCase());
  if (body.budget) candidates = candidates.filter(r => r.budgetRange === body.budget);
  if (body.atmosphere) candidates = candidates.filter(r => r.atmosphere.includes(body.atmosphere!));
  if (body.diningPreference) candidates = candidates.filter(r => r.diningOptions.includes(body.diningPreference!));
  if (body.excludeRestaurantIds?.length) candidates = candidates.filter(r => !body.excludeRestaurantIds!.includes(r.id));

  // Fallback: if too few candidates, use all restaurants
  if (candidates.length < 3) candidates = allRestaurants.filter(r => !body.excludeRestaurantIds?.includes(r.id));

  const aiResult = await getAIRecommendation({
    mood: body.mood,
    budget: body.budget,
    distance: body.distance,
    cuisine: body.cuisine,
    atmosphere: body.atmosphere,
    diningPreference: body.diningPreference,
    userPreferences: userPrefs ? {
      isHalal: userPrefs.isHalal,
      isVegetarian: userPrefs.isVegetarian,
      spiceLevel: userPrefs.spiceLevel,
      favoriteCuisines: userPrefs.favoriteCuisines,
      budgetRange: userPrefs.budgetRange,
    } : undefined,
    restaurants: candidates.map(r => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      description: r.description,
      budgetRange: r.budgetRange,
      atmosphere: r.atmosphere,
      rating: r.rating,
      isHalal: r.isHalal,
      isVegetarianFriendly: r.isVegetarianFriendly,
      tags: r.tags,
      popularDishes: r.popularDishes,
    })),
    excludeIds: body.excludeRestaurantIds,
  });

  const restaurant = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, aiResult.restaurantId)).then(r => r[0]);

  if (!restaurant) throw new Error("Recommended restaurant not found");

  // Save to history
  await db.insert(recommendationsTable).values({
    userId,
    restaurantId: restaurant.id,
    mood: body.mood,
    matchReason: aiResult.matchReason,
    moodInterpretation: aiResult.moodInterpretation,
    score: aiResult.score,
  });

  return {
    restaurant: formatRestaurant(restaurant),
    matchReason: aiResult.matchReason,
    moodInterpretation: aiResult.moodInterpretation,
    score: aiResult.score,
    alternativeIds: aiResult.alternativeIds,
  };
}

router.post("/recommendations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const parsed = GetRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await makeRecommendation(userId, parsed.data);
  res.json(result);
});

router.post("/recommendations/shuffle", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const parsed = ShuffleRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await makeRecommendation(userId, parsed.data);
  res.json(result);
});

router.get("/recommendations/history", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const params = GetRecommendationHistoryQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;

  const history = await db
    .select()
    .from(recommendationsTable)
    .where(eq(recommendationsTable.userId, userId))
    .orderBy(desc(recommendationsTable.createdAt))
    .limit(limit);

  const restaurantIds = [...new Set(history.map(h => h.restaurantId))];
  const restaurants = restaurantIds.length > 0
    ? await db.select().from(restaurantsTable).then(all => all.filter(r => restaurantIds.includes(r.id)))
    : [];

  const restaurantMap = new Map(restaurants.map(r => [r.id, r]));

  const result = history
    .map(h => {
      const restaurant = restaurantMap.get(h.restaurantId);
      if (!restaurant) return null;
      return {
        id: h.id,
        restaurant: formatRestaurant(restaurant),
        mood: h.mood,
        matchReason: h.matchReason,
        createdAt: h.createdAt.toISOString(),
      };
    })
    .filter(Boolean);

  res.json(result);
});

export default router;
