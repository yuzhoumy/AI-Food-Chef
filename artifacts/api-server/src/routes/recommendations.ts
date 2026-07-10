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

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


type RecommendationBody = {
  mood: string;
  budget?: string | null;
  maxBudget?: number | null;
  distance?: number | null;
  cuisine?: string | null;
  atmosphere?: string | null;
  diningOccasion?: string | null;
  diningPreference?: string | null;
  excludeRestaurantIds?: number[];
  userLat?: number | null;
  userLng?: number | null;
};

async function buildCandidates(userId: string, body: RecommendationBody) {
  const userPrefs = await db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.userId, userId))
    .then((r) => r[0]);

  const allRestaurants = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.isOpenNow, true));

  // ── Step 1: hard exclusions ──────────────────────────────────────────────
  let candidates = allRestaurants;

  if (body.excludeRestaurantIds?.length) {
    candidates = candidates.filter((r) => !body.excludeRestaurantIds!.includes(r.id));
  }

  // Dietary hard constraints — never relaxed, even if zero results.
  // A halal user must never receive a non-halal recommendation.
  if (userPrefs?.isHalal === true) {
    candidates = candidates.filter((r) => r.isHalal);
    if (candidates.length === 0) {
      throw new Error(
        "No halal restaurants are available right now. Try adjusting your other filters.",
      );
    }
  }
  if (userPrefs?.isVegetarian === true) {
    candidates = candidates.filter((r) => r.isVegetarianFriendly);
    if (candidates.length === 0) {
      throw new Error(
        "No vegetarian-friendly restaurants are available right now. Try adjusting your other filters.",
      );
    }
  }

  // ── Step 2: distance filter ──────────────────────────────────────────────
  if (body.userLat != null && body.userLng != null && body.distance != null) {
    const { userLat, userLng, distance } = body;
    candidates = candidates.filter((r) => {
      if (r.latitude == null || r.longitude == null) return true; // keep ungeocoded
      return haversineKm(userLat, userLng, r.latitude, r.longitude) <= distance;
    });
  }

  // ── Step 3: preference filters ───────────────────────────────────────────

  // Budget: restaurant's minimum price must be within the user's cap
  if (body.maxBudget != null) {
    const cap = body.maxBudget;
    candidates = candidates.filter((r) => r.priceMin <= cap);
  }

  // Cuisine: case-insensitive substring match against cuisines[] or cuisine field
  if (body.cuisine) {
    const needle = body.cuisine.toLowerCase();
    candidates = candidates.filter(
      (r) =>
        r.cuisine.toLowerCase().includes(needle) ||
        r.cuisines.some((c) => c.toLowerCase().includes(needle)),
    );
  }

  // Dining occasion: e.g. "Date Night", "Family", "Casual"
  if (body.diningOccasion) {
    const occ = body.diningOccasion.toLowerCase();
    candidates = candidates.filter((r) =>
      r.diningOccasion.some(
        (d) => d.toLowerCase().includes(occ) || occ.includes(d.toLowerCase()),
      ),
    );
  }

  // Atmosphere / vibe: case-insensitive
  if (body.atmosphere) {
    const vibe = body.atmosphere.toLowerCase();
    candidates = candidates.filter((r) =>
      r.atmosphere.some(
        (a) => a.toLowerCase().includes(vibe) || vibe.includes(a.toLowerCase()),
      ),
    );
  }

  // Dining preference (dine-in / takeaway / delivery)
  if (body.diningPreference) {
    candidates = candidates.filter((r) =>
      r.diningOptions.some(
        (d) => d.toLowerCase() === body.diningPreference!.toLowerCase(),
      ),
    );
  }

  return { candidates, userPrefs };
}

async function makeRecommendation(userId: string, body: RecommendationBody) {
  // ── Try with all preferences, then progressively relax soft constraints ──
  // Order: full filters → drop dining occasion → drop dining occasion + vibe.
  let relaxedBody = body;
  let result = await buildCandidates(userId, relaxedBody);

  if (result.candidates.length === 0 && body.diningOccasion) {
    relaxedBody = { ...body, diningOccasion: null };
    result = await buildCandidates(userId, relaxedBody);
  }

  if (result.candidates.length === 0 && body.atmosphere) {
    relaxedBody = { ...relaxedBody, atmosphere: null };
    result = await buildCandidates(userId, relaxedBody);
  }

  let { candidates, userPrefs } = result;

  // ── Step 4: bail out if nothing survived even the relaxed filters ──────────
  if (candidates.length === 0) {
    const err = new Error("There is no restaurant that suits your needs!") as Error & { code: string };
    err.code = "NO_MATCH";
    throw err;
  }

  // ── Step 5: sort by rating so AI sees the best options first ──────────────
  candidates = [...candidates].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const aiResult = await getAIRecommendation({
    mood: relaxedBody.mood,
    maxBudget: relaxedBody.maxBudget,
    budget: relaxedBody.budget,
    distance: relaxedBody.distance,
    cuisine: relaxedBody.cuisine,
    atmosphere: relaxedBody.atmosphere,
    diningOccasion: relaxedBody.diningOccasion,
    diningPreference: relaxedBody.diningPreference,
    userPreferences: userPrefs
      ? {
          isHalal: userPrefs.isHalal,
          isVegetarian: userPrefs.isVegetarian,
          spiceLevel: userPrefs.spiceLevel,
          favoriteCuisines: userPrefs.favoriteCuisines,
          budgetRange: userPrefs.budgetRange,
        }
      : undefined,
    restaurants: candidates.map((r) => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      cuisines: r.cuisines,
      description: r.description,
      priceMin: r.priceMin,
      priceMax: r.priceMax,
      budgetRange: r.budgetRange,
      diningOccasion: r.diningOccasion,
      atmosphere: r.atmosphere,
      rating: r.rating,
      isHalal: r.isHalal,
      isVegetarianFriendly: r.isVegetarianFriendly,
      tags: r.tags,
      popularDishes: r.popularDishes,
    })),
    excludeIds: relaxedBody.excludeRestaurantIds,
  });

  const restaurant = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, aiResult.restaurantId))
    .then((r) => r[0]);

  if (!restaurant) throw new Error("Recommended restaurant not found");

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

function handleRecommendationError(err: unknown, res: import("express").Response): void {
  if (err instanceof Error && (err as any).code === "NO_MATCH") {
    res.status(422).json({ error: err.message, code: "NO_MATCH" });
    return;
  }
  const message = err instanceof Error ? err.message : "Failed to get recommendation";
  res.status(500).json({ error: message });
}

router.post("/recommendations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = GetRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const result = await makeRecommendation(userId, parsed.data);
    res.json(result);
  } catch (err: unknown) {
    handleRecommendationError(err, res);
  }
});

router.post("/recommendations/shuffle", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = ShuffleRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const result = await makeRecommendation(userId, parsed.data);
    res.json(result);
  } catch (err: unknown) {
    handleRecommendationError(err, res);
  }
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

  const restaurantIds = [...new Set(history.map((h) => h.restaurantId))];
  const restaurants =
    restaurantIds.length > 0
      ? await db
          .select()
          .from(restaurantsTable)
          .then((all) => all.filter((r) => restaurantIds.includes(r.id)))
      : [];

  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));

  const result = history
    .map((h) => {
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
