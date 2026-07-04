import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, restaurantsTable, createRestaurantSchema } from "@workspace/db";
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

  const restaurant = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, params.data.id))
    .then(r => r[0]);

  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  res.json(formatRestaurant(restaurant));
});

/**
 * POST /restaurants
 * Create a new user-submitted restaurant listing.
 */
router.post("/restaurants", async (req, res): Promise<void> => {
  const parsed = createRestaurantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i: { message: string }) => i.message).join(", ") });
    return;
  }

  const data = parsed.data;

  // Derive legacy fields from new structured data for backward compatibility
  const cuisine = data.cuisines[0] ?? "";
  const budgetRange = `RM${data.priceMin}-RM${data.priceMax}`;

  const [restaurant] = await db
    .insert(restaurantsTable)
    .values({
      name: data.name,
      cuisine,
      cuisines: data.cuisines,
      description: data.description,
      address: data.address,
      area: data.area ?? "",
      budgetRange,
      priceMin: data.priceMin,
      priceMax: data.priceMax,
      diningOccasion: data.diningOccasion,
      photos: data.photos ?? [],
      isHalal: data.isHalal ?? false,
      isVegetarianFriendly: data.isVegetarianFriendly ?? false,
      isUserSubmitted: true,
      isOpenNow: true,
      rating: 0,
      reviewCount: 0,
      tags: [...data.cuisines, ...data.diningOccasion],
    })
    .returning();

  res.status(201).json(formatRestaurant(restaurant));
});

export default router;
