import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const preferencesTable = pgTable("preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  isHalal: boolean("is_halal"),
  isVegetarian: boolean("is_vegetarian"),
  spiceLevel: text("spice_level"),
  allergies: text("allergies").array().notNull().default([]),
  favoriteCuisines: text("favorite_cuisines").array().notNull().default([]),
  budgetRange: text("budget_range"),
  diningPreference: text("dining_preference"),
  frequentAreas: text("frequent_areas").array().notNull().default([]),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPreferencesSchema = createInsertSchema(preferencesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;
export type Preferences = typeof preferencesTable.$inferSelect;
