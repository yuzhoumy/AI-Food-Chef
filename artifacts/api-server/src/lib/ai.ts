import OpenAI from "openai";
import { z } from "zod/v4";
import { logger } from "./logger";

const AIRecommendationSchema = z.object({
  restaurantId: z.number().int().positive(),
  moodInterpretation: z.string().min(1),
  matchReason: z.string().min(1),
  score: z.number().min(0).max(1),
  alternativeIds: z.array(z.number().int().positive()).max(5),
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RecommendationContext {
  mood: string;
  maxBudget?: number | null;
  budget?: string | null;
  distance?: number | null;
  cuisine?: string | null;
  atmosphere?: string | null;
  diningOccasion?: string | null;
  diningPreference?: string | null;
  userPreferences?: {
    isHalal?: boolean | null;
    isVegetarian?: boolean | null;
    spiceLevel?: string | null;
    favoriteCuisines?: string[];
    budgetRange?: string | null;
  };
  restaurants: Array<{
    id: number;
    name: string;
    cuisine: string;
    cuisines: string[];
    description: string;
    priceMin: number;
    priceMax: number;
    budgetRange: string;
    diningOccasion: string[];
    atmosphere: string[];
    rating: number;
    isHalal: boolean;
    isVegetarianFriendly: boolean;
    tags: string[];
    popularDishes: string[];
  }>;
  excludeIds?: number[];
}

export interface AIRecommendation {
  restaurantId: number;
  matchReason: string;
  moodInterpretation: string;
  score: number;
  alternativeIds: number[];
}

export async function getAIRecommendation(ctx: RecommendationContext): Promise<AIRecommendation> {
  // Build a rich, structured line per restaurant so the AI has everything it needs
  const restaurantList = ctx.restaurants
    .filter((r) => !ctx.excludeIds?.includes(r.id))
    .slice(0, 30)
    .map((r) => {
      const cuisineStr = r.cuisines.length ? r.cuisines.join("/") : r.cuisine;
      const priceStr = `RM${r.priceMin}–RM${r.priceMax}`;
      const occasionStr = r.diningOccasion.join(", ") || "General";
      const vibeStr = r.atmosphere.join(", ") || "—";
      return (
        `ID:${r.id} | ${r.name} | Cuisine:${cuisineStr} | Price:${priceStr} | ` +
        `Rating:${r.rating} | Occasions:[${occasionStr}] | Vibe:[${vibeStr}] | ` +
        `Halal:${r.isHalal} | Veg:${r.isVegetarianFriendly} | ` +
        `Dishes:[${r.popularDishes.slice(0, 3).join(", ")}] | Tags:[${r.tags.slice(0, 4).join(", ")}]`
      );
    })
    .join("\n");

  // Build explicit filter constraints string
  const constraints: string[] = [];
  if (ctx.maxBudget != null) constraints.push(`Max budget: RM${ctx.maxBudget} per person — only recommend restaurants where price_min ≤ ${ctx.maxBudget}`);
  if (ctx.cuisine) constraints.push(`Cuisine must be: ${ctx.cuisine}`);
  if (ctx.diningOccasion) constraints.push(`Dining occasion: ${ctx.diningOccasion}`);
  if (ctx.atmosphere) constraints.push(`Desired vibe/atmosphere: ${ctx.atmosphere}`);
  if (ctx.distance != null) constraints.push(`Max distance: ${ctx.distance} km from user`);
  if (ctx.diningPreference) constraints.push(`Dining preference: ${ctx.diningPreference}`);
  if (ctx.userPreferences?.isHalal === true) constraints.push("MUST be Halal-certified");
  if (ctx.userPreferences?.isVegetarian === true) constraints.push("MUST be vegetarian-friendly");
  if (ctx.userPreferences?.favoriteCuisines?.length) {
    constraints.push(`User's favourite cuisines: ${ctx.userPreferences.favoriteCuisines.join(", ")}`);
  }
  if (ctx.excludeIds?.length) constraints.push(`Exclude restaurant IDs: ${ctx.excludeIds.join(", ")}`);

  const constraintBlock = constraints.length
    ? `HARD CONSTRAINTS (you MUST respect these when choosing):\n${constraints.map((c) => `• ${c}`).join("\n")}`
    : "";

  const prompt = `You are an expert food concierge for Malaysia. Your job is to pick the single best restaurant from the candidate list that matches the user's request.

User's request: "${ctx.mood}"

${constraintBlock}

Candidate restaurants (already pre-filtered to best matches, sorted by rating):
${restaurantList}

INSTRUCTIONS:
1. Re-read the hard constraints above. Eliminate any restaurants that violate them.
2. From the remaining candidates, pick the ONE that best matches the user's mood, occasion, vibe, and cuisine preference.
3. Prefer higher-rated restaurants when two are equally good matches.
4. Return 3–4 good alternatives from the remaining candidates as well.
5. Write matchReason in a warm, conversational tone (1–2 sentences) explaining specifically why this restaurant suits the user's request.
6. Write moodInterpretation (1–2 sentences) paraphrasing what the user is looking for.

Respond with ONLY a JSON object, no markdown:
{
  "restaurantId": <integer ID from the list>,
  "moodInterpretation": "<1-2 sentences>",
  "matchReason": "<1-2 sentences>",
  "score": <0.0–1.0>,
  "alternativeIds": [<3-4 IDs>]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 512,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");

    const raw = JSON.parse(content);
    const validated = AIRecommendationSchema.safeParse(raw);
    if (!validated.success) {
      logger.warn({ issues: validated.error.issues, raw }, "OpenAI response failed validation, using fallback");
      throw new Error("Invalid AI response shape");
    }

    // Ensure recommended restaurant is actually in candidate list
    const candidateIds = ctx.restaurants.map((r) => r.id);
    if (!candidateIds.includes(validated.data.restaurantId)) {
      logger.warn({ restaurantId: validated.data.restaurantId }, "AI recommended non-candidate restaurant, using fallback");
      throw new Error("AI recommended out-of-candidate restaurant");
    }

    return validated.data;
  } catch (error) {
    logger.error({ error }, "OpenAI recommendation failed");
    // Fallback: best-rated available restaurant
    const available = ctx.restaurants.filter((r) => !ctx.excludeIds?.includes(r.id));
    const fallback = available[0];
    if (!fallback) throw new Error("No restaurants available");
    return {
      restaurantId: fallback.id,
      moodInterpretation: "Finding the best match for you.",
      matchReason: "This highly-rated restaurant matches your preferences.",
      score: 0.7,
      alternativeIds: available.slice(1, 5).map((r) => r.id),
    };
  }
}
