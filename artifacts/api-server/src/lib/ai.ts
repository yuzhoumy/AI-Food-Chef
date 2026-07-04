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
  budget?: string | null;
  distance?: number | null;
  cuisine?: string | null;
  atmosphere?: string | null;
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
    description: string;
    budgetRange: string;
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
  const restaurantList = ctx.restaurants
    .filter(r => !ctx.excludeIds?.includes(r.id))
    .slice(0, 20)
    .map(r => `ID:${r.id} | ${r.name} | ${r.cuisine} | ${r.budgetRange} | Rating:${r.rating} | Atmosphere:[${r.atmosphere.join(",")}] | Halal:${r.isHalal} | Vegetarian:${r.isVegetarianFriendly} | Tags:[${r.tags.join(",")}] | Dishes:[${r.popularDishes.join(",")}]`)
    .join("\n");

  const userPrefStr = ctx.userPreferences
    ? `User preferences: Halal=${ctx.userPreferences.isHalal}, Vegetarian=${ctx.userPreferences.isVegetarian}, SpiceLevel=${ctx.userPreferences.spiceLevel}, FavCuisines=[${ctx.userPreferences.favoriteCuisines?.join(",") ?? ""}], Budget=${ctx.userPreferences.budgetRange}`
    : "";

  const filters = [
    ctx.budget && `Budget filter: ${ctx.budget}`,
    ctx.cuisine && `Cuisine filter: ${ctx.cuisine}`,
    ctx.atmosphere && `Atmosphere filter: ${ctx.atmosphere}`,
    ctx.diningPreference && `Dining preference: ${ctx.diningPreference}`,
  ].filter(Boolean).join(", ");

  const prompt = `You are an AI food concierge. Based on the user's mood and context, recommend the best restaurant.

User mood/input: "${ctx.mood}"
${userPrefStr}
${filters ? `Active filters: ${filters}` : ""}

Available restaurants:
${restaurantList}

Respond with a JSON object (no markdown, just JSON):
{
  "restaurantId": <best matching restaurant ID>,
  "moodInterpretation": "<1-2 sentences interpreting the user's mood/craving>",
  "matchReason": "<1-2 sentences explaining why this restaurant is the perfect match>",
  "score": <match score 0.0-1.0>,
  "alternativeIds": [<3-4 other good restaurant IDs in order of preference>]
}

Consider: mood match, cuisine preference, budget constraints, atmosphere, dietary restrictions, and restaurant quality.`;

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
    const candidateIds = ctx.restaurants.map(r => r.id);
    if (!candidateIds.includes(validated.data.restaurantId)) {
      logger.warn({ restaurantId: validated.data.restaurantId }, "AI recommended non-candidate restaurant, using fallback");
      throw new Error("AI recommended out-of-candidate restaurant");
    }
    return validated.data;
  } catch (error) {
    logger.error({ error }, "OpenAI recommendation failed");
    // Fallback: return first available restaurant
    const available = ctx.restaurants.filter(r => !ctx.excludeIds?.includes(r.id));
    const fallback = available[0];
    if (!fallback) throw new Error("No restaurants available");
    return {
      restaurantId: fallback.id,
      moodInterpretation: "Finding the perfect match for you.",
      matchReason: "This restaurant has great reviews and matches your preferences.",
      score: 0.7,
      alternativeIds: available.slice(1, 5).map(r => r.id),
    };
  }
}
