// Assign generated cuisine images to restaurants with empty photos.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Pool } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || resolve(__dirname, "..");
const IMAGE_DIR = resolve(WORKSPACE_ROOT, "attached_assets/generated_images");
const CACHE_FILE = resolve(IMAGE_DIR, "cuisine-image-urls.json");

const API_BASE = process.env.API_BASE || "http://localhost:8080/api";
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE_UPLOAD = process.argv.includes("--force-upload");

const CATEGORY_IMAGES = {
  chinese: resolve(IMAGE_DIR, "cuisine-chinese.jpg"),
  malay: resolve(IMAGE_DIR, "cuisine-malay.jpg"),
  indian: resolve(IMAGE_DIR, "cuisine-indian.jpg"),
  japanese: resolve(IMAGE_DIR, "cuisine-japanese.jpg"),
  korean: resolve(IMAGE_DIR, "cuisine-korean.jpg"),
  western: resolve(IMAGE_DIR, "cuisine-western.jpg"),
  european: resolve(IMAGE_DIR, "cuisine-european.jpg"),
  cafe: resolve(IMAGE_DIR, "cuisine-cafe.jpg"),
  peranakan: resolve(IMAGE_DIR, "cuisine-peranakan.jpg"),
  seafood: resolve(IMAGE_DIR, "cuisine-seafood.jpg"),
  thai: resolve(IMAGE_DIR, "cuisine-thai.jpg"),
  middle_eastern: resolve(IMAGE_DIR, "cuisine-middle_eastern.jpg"),
  street_food: resolve(IMAGE_DIR, "cuisine-street_food.jpg"),
  vegetarian: resolve(IMAGE_DIR, "cuisine-vegetarian.jpg"),
  fusion: resolve(IMAGE_DIR, "cuisine-fusion.jpg"),
};

// Map a cuisine string to one of the CATEGORY_IMAGES keys.
// Order matters: more specific wins.
const cuisineMap = [
  ["seafood", ["Seafood", "Chinese / Seafood", "Malay / Seafood", "Malaysian / Seafood"]],
  ["thai", ["Thai"]],
  ["middle_eastern", ["Middle Eastern"]],
  ["peranakan", ["Peranakan", "Nyonya", "Malaysian / Peranakan Fusion", "Nyonya Desserts"]],
  ["korean", ["Korean", "Korean / Cafe"]],
  ["japanese", ["Japanese", "Japanese Fusion", "Japanese / Barbecue", "Japanese / Wagyu", "Japanese-French Pastries", "Sushi", "Omakase"]],
  ["indian", ["Indian", "Indian Muslim", "Indian-Muslim", "Indian Vegetarian", "North Indian", "South Indian", "Modern Indian"]],
  ["chinese", ["Chinese", "Cantonese", "Dim Sum", "Sichuan", "Shanghainese", "Fujian", "Shunde", "Chinese / Dumplings", "Chinese / Roasted Meat", "Chinese / Seafood", "Hainanese", "Hakka", "Hotpot", "Noodles", "Taiwanese"]],
  ["malay", ["Malay", "Malaysian", "Mamak", "Mamak / Indian-Muslim", "Mamak / Nasi Kandar", "Malay / Middle Eastern Fusion", "Malay / Nasi Beriani", "Malay / Nasi Briyani", "Malay / Seafood", "Malay / Sup Tulang", "Indonesian / Malay", "Malaysian / Hainanese Kopitiam", "Malaysian / Kopitiam", "Malaysian / Peranakan Fusion", "Malaysian / Seafood", "Malaysian Street Food", "Indonesian", "Modern Malaysian", "Kopitiam"]],
  ["western", ["Western", "American", "Steakhouse", "Texas Barbecue / Western", "Western / Steakhouse", "Hainanese / Western", "Barbecue"]],
  ["european", ["European", "French", "French-Japanese Pastries", "Modern European", "Modern European / Fusion", "Contemporary", "Contemporary European", "Fine Dining", "International", "International Buffet", "British"]],
  ["street_food", ["Street Food", "Malaysian Street Food", "Hipster Cafe / Street Food"]],
  ["vegetarian", ["Vegetarian", "Indian Vegetarian", "Healthy", "Healthy Eating", "Clean Eating"]],
  ["cafe", ["Cafe", "Café", "Cafe / Western", "Cafe / Fusion", "Cafe / Desserts", "Cafe / Dessert", "Cafe / Asian Fusion", "Cafe / Clean Eating", "Cafe / Japanese Fusion", "Cafe / Malaysian Fusion", "Cafe / Pastries", "Cafe / Sourdough", "Cafe / Western Fusion", "Bakery", "Bakery / Cafe", "Traditional Bakery", "Dessert", "Desserts", "Dessert / Pastries", "Dessert Cafe", "Novelty Dessert Cafe", "Liquid Nitrogen Ice Cream", "Japanese-French Pastries", "Beverage Bar / Cafe", "Specialty Coffee", "Specialty Coffee / Cafe", "Specialty Coffee Bar", "Healthy Café"]],
  ["fusion", ["Fusion", "Asian Fusion", "International", "Cafe / Fusion", "Malay / Middle Eastern Fusion", "Modern European / Fusion", "Western Fusion", "Hainanese / Western", "Hainanese", "South American", "Latin American", "Peruvian Fusion"]],
];

const knownCuisinesLower = new Set(
  cuisineMap.flatMap(([, names]) => names).map(n => n.toLowerCase())
);

function getCategory(cuisine) {
  if (!cuisine) return "fusion";
  const normalized = String(cuisine).trim().toLowerCase();
  // Exact match first
  for (const [cat, names] of cuisineMap) {
    for (const name of names) {
      if (normalized === name.toLowerCase()) return cat;
    }
  }
  // Substring fallback
  for (const [cat, names] of cuisineMap) {
    for (const name of names) {
      if (normalized.includes(name.toLowerCase())) return cat;
    }
  }
  return "fusion";
}

function pickCuisine(cuisine, cuisines) {
  const candidates = [];
  if (cuisine) candidates.push(cuisine);
  if (Array.isArray(cuisines)) {
    for (const c of cuisines) {
      if (c) candidates.push(c);
    }
  }
  if (candidates.length === 0) return "";

  // Prefer the candidate that maps to a known (non-fusion) category.
  // If both primary and cuisines map, prefer the primary cuisine field.
  const mapped = candidates.map(c => ({ value: c, category: getCategory(c) }));
  const nonFusion = mapped.find(m => m.category !== "fusion");
  if (nonFusion) return nonFusion.value;
  return candidates[0];
}

async function uploadImage(filePath) {
  const fileBuffer = await readFile(filePath);
  const name = filePath.split("/").pop();
  const size = fileBuffer.length;
  const contentType = "image/jpeg";

  // Step 1: request presigned URL
  const metaRes = await fetch(`${API_BASE}/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, size, contentType }),
  });
  if (!metaRes.ok) {
    throw new Error(`Failed to request upload URL for ${name}: ${metaRes.status} ${await metaRes.text()}`);
  }
  const { uploadURL, objectPath } = await metaRes.json();

  // Step 2: upload directly to GCS
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    body: fileBuffer,
    headers: { "Content-Type": contentType },
  });
  if (!uploadRes.ok) {
    throw new Error(`Upload to storage failed for ${name}: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  // Serving path stored in DB (matches the app's upload convention)
  return `/api/storage${objectPath}`;
}

async function loadUrlCache() {
  if (!existsSync(CACHE_FILE) || FORCE_UPLOAD) return {};
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function saveUrlCache(cache) {
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function getDistinctSources(pool) {
  // Collect all non-empty cuisine values from both the legacy column and every element of cuisines[]
  const { rows } = await pool.query(`
    SELECT DISTINCT LOWER(TRIM(value)) as source
    FROM (
      SELECT cuisine as value FROM restaurants WHERE NULLIF(cuisine, '') IS NOT NULL
      UNION ALL
      SELECT unnest(cuisines) as value FROM restaurants WHERE cuisines IS NOT NULL AND array_length(cuisines, 1) > 0
    ) all_values
    WHERE NULLIF(value, '') IS NOT NULL
  `);
  return rows.map(r => r.source).filter(Boolean);
}

async function runPreflight(pool) {
  const sources = await getDistinctSources(pool);
  const unmapped = sources.filter(s => !knownCuisinesLower.has(s));
  if (unmapped.length > 0) {
    console.warn("WARNING: Unmapped cuisine values will fall back to fusion:");
    for (const s of unmapped) console.warn(`  - ${s}`);
  } else {
    console.log("Preflight passed: all distinct cuisine values are mapped.");
  }
  return unmapped;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const unmapped = await runPreflight(pool);

    // Find restaurants that need photos and group by category using robust mapping
    console.log("Finding restaurants with empty photos...");
    const { rows: emptyRows } = await pool.query(`
      SELECT id, cuisine, cuisines
      FROM restaurants
      WHERE photos IS NULL OR array_length(photos, 1) IS NULL OR array_length(photos, 1) = 0
    `);
    console.log(`Found ${emptyRows.length} restaurants with empty photos`);

    if (emptyRows.length === 0) {
      console.log("No restaurants need photos. Exiting.");
      return;
    }

    if (DRY_RUN) {
      console.log("Dry run: would update the following groups:");
      const categoryGroups = new Map();
      for (const row of emptyRows) {
        const source = pickCuisine(row.cuisine, row.cuisines);
        const category = getCategory(source);
        if (!categoryGroups.has(category)) categoryGroups.set(category, 0);
        categoryGroups.set(category, categoryGroups.get(category) + 1);
      }
      for (const [cat, count] of categoryGroups) {
        console.log(`  ${cat}: ${count}`);
      }
      return;
    }

    // Upload each category image (or reuse cached URL) and build category -> serving URL
    const categoryUrls = await loadUrlCache();
    for (const [category, filePath] of Object.entries(CATEGORY_IMAGES)) {
      if (categoryUrls[category] && !FORCE_UPLOAD) {
        console.log(`Reusing cached ${category} URL: ${categoryUrls[category]}`);
        continue;
      }
      console.log(`Uploading ${category}...`);
      const url = await uploadImage(filePath);
      categoryUrls[category] = url;
      console.log(`  -> ${url}`);
    }
    await saveUrlCache(categoryUrls);

    const categoryGroups = new Map();
    for (const row of emptyRows) {
      const source = pickCuisine(row.cuisine, row.cuisines);
      const category = getCategory(source);
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category).push(row.id);
    }

    // Update each group in a single parameterized query, keeping the empty-photos guard
    let totalUpdated = 0;
    for (const [category, ids] of categoryGroups) {
      const url = categoryUrls[category];
      if (!url) {
        console.warn(`No URL for ${category}; skipping ${ids.length} restaurants`);
        continue;
      }
      console.log(`Updating ${ids.length} ${category} restaurants...`);
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
      const urlPlaceholder = `$${ids.length + 1}`;
      const result = await pool.query(
        `UPDATE restaurants
         SET photos = ARRAY[${urlPlaceholder}]
         WHERE id IN (${placeholders})
           AND (photos IS NULL OR array_length(photos, 1) IS NULL OR array_length(photos, 1) = 0)`,
        [...ids, url]
      );
      totalUpdated += result.rowCount;
    }
    console.log(`Updated ${totalUpdated} restaurants in total`);

    // Report any distinct cuisine values that are not explicitly known
    const stillUnmapped = new Set();
    for (const row of emptyRows) {
      const source = pickCuisine(row.cuisine, row.cuisines);
      if (!knownCuisinesLower.has(source.toLowerCase())) {
        stillUnmapped.add(source);
      }
    }
    if (stillUnmapped.size > 0) {
      console.log("Unknown cuisine values that fell back to fusion:", [...stillUnmapped]);
    }

    if (unmapped.length > 0) {
      console.warn("Some distinct cuisine values in the database are still unmapped; review the cuisineMap.");
    }

    // Verify
    const verify = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE photos IS NULL OR array_length(photos, 1) IS NULL OR array_length(photos, 1) = 0) as still_empty
      FROM restaurants
    `);
    console.log("Verification:", verify.rows[0]);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
