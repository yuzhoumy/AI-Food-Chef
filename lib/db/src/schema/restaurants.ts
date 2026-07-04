import { pgTable, serial, text, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantsTable = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cuisine: text("cuisine").notNull(),
  description: text("description").notNull().default(""),
  address: text("address").notNull().default(""),
  area: text("area").notNull().default(""),
  latitude: real("latitude"),
  longitude: real("longitude"),
  budgetRange: text("budget_range").notNull().default("RM15-RM30"),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({ id: true, createdAt: true });
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;
