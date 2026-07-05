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

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "for", "with", "of", "in", "on", "at", "to", "from",
  "is", "are", "was", "were", "be", "being", "been", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those",
  "i", "me", "my", "we", "us", "our", "you", "your", "he", "she", "it", "they", "them", "their",
  "looking", "great", "good", "want", "wants", "some", "something", "meal", "food", "restaurant",
  "place", "eat", "dining", "out", "night", "day", "spicy",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function scoreRestaurant(ctx: RecommendationContext, r: RecommendationContext["restaurants"][number]): number {
  let score = 0;

  // Strong signal: exact structured preferences that survived the hard filters
  if (ctx.cuisine) {
    const c = ctx.cuisine.toLowerCase();
    if (r.cuisine.toLowerCase().includes(c) || r.cuisines.some((x) => x.toLowerCase().includes(c))) {
      score += 10;
    }
  }
  if (ctx.diningOccasion) {
    const o = ctx.diningOccasion.toLowerCase();
    if (r.diningOccasion.some((x) => x.toLowerCase().includes(o))) {
      score += 10;
    }
  }
  if (ctx.atmosphere) {
    const a = ctx.atmosphere.toLowerCase();
    if (r.atmosphere.some((x) => x.toLowerCase().includes(a))) {
      score += 10;
    }
  }

  // Secondary signal: natural-language mood keywords across restaurant fields
  const keywords = extractKeywords(ctx.mood || "");
  const haystack = [
    r.name,
    r.cuisine,
    ...r.cuisines,
    r.description,
    ...r.tags,
    ...r.atmosphere,
    ...r.diningOccasion,
    ...r.popularDishes,
  ]
    .join(" ")
    .toLowerCase();
  for (const kw of keywords) {
    if (haystack.includes(kw)) score += 1;
  }

  // Tiebreaker: community rating
  score += (r.rating || 0) * 0.5;
  return score;
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
    // Fallback: score remaining candidates by how well they match the user's
    // explicit preferences and mood, then pick from the top-scored set with
    // weighted randomness so low-signal requests don't always return the same
    // highest-rated restaurant.
    const available = ctx.restaurants.filter((r) => !ctx.excludeIds?.includes(r.id));
    if (available.length === 0) throw new Error("No restaurants available");
    const scored = available
      .map((r) => ({ restaurant: r, score: scoreRestaurant(ctx, r) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.restaurant.rating || 0) - (a.restaurant.rating || 0);
      });

    const TOP_N = 5;
    const top = scored.slice(0, Math.min(TOP_N, scored.length));
    const totalWeight = top.reduce((sum, s) => sum + s.score + 1, 0); // +1 gives a baseline chance even when scores are tied/low
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    let chosen = top[0];
    for (const entry of top) {
      cumulative += entry.score + 1;
      if (rand <= cumulative) {
        chosen = entry;
        break;
      }
    }

    return {
      restaurantId: chosen.restaurant.id,
      moodInterpretation: "Finding the best match for your request.",
      matchReason: "This spot lines up with your preferences and is highly rated by the community.",
      score: 0.7,
      alternativeIds: scored
        .filter((s) => s.restaurant.id !== chosen.restaurant.id)
        .slice(0, 5)
        .map((s) => s.restaurant.id),
    };
  }
}
