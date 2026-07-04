import { pgTable, serial, text, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantsTable = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Legacy single-cuisine field (kept for seeded data compatibility)
  cuisine: text("cuisine").notNull().default(""),
  // New multi-cuisine array
  cuisines: text("cuisines").array().notNull().default([]),
  description: text("description").notNull().default(""),
  address: text("address").notNull().default(""),
  area: text("area").notNull().default(""),
  latitude: real("latitude"),
  longitude: real("longitude"),
  // Legacy budget string (kept for seeded data compatibility)
  budgetRange: text("budget_range").notNull().default("RM15-RM30"),
  // New numeric price range in RM
  priceMin: integer("price_min").notNull().default(15),
  priceMax: integer("price_max").notNull().default(30),
  // Dining occasions (e.g. "Casual", "Date Night", "Family Gathering")
  diningOccasion: text("dining_occasion").array().notNull().default([]),
  atmosphere: text("atmosphere").array().notNull().default([]),
  diningOptions: text("dining_options").array().notNull().default([]),
  openingHours: text("opening_hours").notNull().default("10:00 AM - 10:00 PM"),
  isOpenNow: boolean("is_open_now").notNull().default(true),
  rating: real("rating").notNull().default(4.0),
  reviewCount: integer("review_count").notNull().default(0),
  photos: text("photos").array().notNull().default([]),
  popularDishes: text("popular_dishes").array().notNull().default([]),
  isHalal: boolean("is_halal").notNull().default(false),
  isVegetarianFriendly: boolean("is_vegetarian_friendly").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  isFeatured: boolean("is_featured").notNull().default(false),
  // Flag for user-submitted restaurants
  isUserSubmitted: boolean("is_user_submitted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({ id: true, createdAt: true });
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;

// Zod schema for the business "Add Restaurant" form submission
export const createRestaurantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  cuisines: z.array(z.string()).min(1, "Select at least one cuisine"),
  diningOccasion: z.array(z.string()).min(1, "Select at least one dining occasion"),
  priceMin: z.number().int().min(5).max(500),
  priceMax: z.number().int().min(5).max(500),
  address: z.string().min(5, "Address must be at least 5 characters").max(500),
  area: z.string().max(100).optional().default(""),
  // Photos are stored as object paths or full URLs — accept any non-empty string
  photos: z.array(z.string().min(1)).max(10).optional().default([]),
  isHalal: z.boolean().optional().default(false),
  isVegetarianFriendly: z.boolean().optional().default(false),
}).refine((d) => d.priceMin < d.priceMax, {
  message: "Minimum price must be less than maximum price",
  path: ["priceMin"],
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
