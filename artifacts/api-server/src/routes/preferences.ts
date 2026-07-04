import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, preferencesTable } from "@workspace/db";
import { UpdatePreferencesBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/preferences", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  let prefs = await db.select().from(preferencesTable).where(eq(preferencesTable.userId, userId)).then(r => r[0]);

  if (!prefs) {
    const [created] = await db.insert(preferencesTable).values({ userId }).returning();
    prefs = created;
  }

  res.json({
    ...prefs,
    createdAt: prefs.createdAt.toISOString(),
    updatedAt: prefs.updatedAt.toISOString(),
  });
});

router.put("/preferences", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const parsed = UpdatePreferencesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(preferencesTable).where(eq(preferencesTable.userId, userId)).then(r => r[0]);

  let prefs;
  if (existing) {
    [prefs] = await db.update(preferencesTable).set(parsed.data).where(eq(preferencesTable.userId, userId)).returning();
  } else {
    [prefs] = await db.insert(preferencesTable).values({ userId, ...parsed.data }).returning();
  }

  res.json({
    ...prefs,
    createdAt: prefs.createdAt.toISOString(),
    updatedAt: prefs.updatedAt.toISOString(),
  });
});

export default router;
