import fs from "node:fs";
import { execFileSync } from "node:child_process";

const path =
  "attached_assets/Pasted--id-45-name-Keijometo-cuisine-Cafe-Japanese-Fusio-17832_1783271889271.txt";
const raw = fs.readFileSync(path, "utf8");
const restaurants = JSON.parse(raw);

const REQUIRED_IDS = new Set(restaurants.map((r) => r.id));

function esc(str) {
  return String(str ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''");
}

function arr(a) {
  if (!Array.isArray(a) || a.length === 0) return "ARRAY[]::text[]";
  return `ARRAY[${a.map((v) => `'${esc(v)}'`).join(", ")}]::text[]`;
}

function bool(v) {
  if (typeof v === "boolean") return v ? "true" : "false";
  throw new Error(`Expected boolean but got ${JSON.stringify(v)}`);
}

function num(v) {
  if (v === null || v === undefined) return "NULL";
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Expected finite number but got ${JSON.stringify(v)}`);
  }
  return String(n);
}

function int(v) {
  if (v === null || v === undefined) return "NULL";
  const n = Number(v);
  if (!Number.isInteger(n)) {
    throw new Error(`Expected integer but got ${JSON.stringify(v)}`);
  }
  return String(n);
}

function ts(v) {
  if (!v) return "NOW()";
  return `'${esc(v)}'::timestamptz`;
}

const columns = [
  "id",
  "name",
  "cuisine",
  "cuisines",
  "description",
  "address",
  "area",
  "latitude",
  "longitude",
  "budget_range",
  "price_min",
  "price_max",
  "dining_occasion",
  "atmosphere",
  "dining_options",
  "opening_hours",
  "is_open_now",
  "rating",
  "review_count",
  "photos",
  "popular_dishes",
  "is_halal",
  "is_vegetarian_friendly",
  "tags",
  "is_featured",
  "is_user_submitted",
  "created_at",
];

const rows = restaurants.map((r) => {
  // Schema default is true; normalise null/undefined so the restaurant is visible
  // to the recommendation filter that requires is_open_now = true.
  const isOpenNow = r.is_open_now === true ? true : r.is_open_now === false ? false : true;
  return [
    int(r.id),
    `'${esc(r.name)}'`,
    `'${esc(r.cuisine)}'`,
    arr(r.cuisines),
    `'${esc(r.description)}'`,
    `'${esc(r.address)}'`,
    `'${esc(r.area)}'`,
    num(r.latitude),
    num(r.longitude),
    `'${esc(r.budget_range)}'`,
    int(r.price_min),
    int(r.price_max),
    arr(r.dining_occasion),
    arr(r.atmosphere),
    arr(r.dining_options),
    `'${esc(r.opening_hours)}'`,
    bool(isOpenNow),
    num(r.rating),
    int(r.review_count),
    arr(r.photos),
    arr(r.popular_dishes),
    bool(r.is_halal),
    bool(r.is_vegetarian_friendly),
    arr(r.tags),
    bool(r.is_featured),
    bool(r.is_user_submitted),
    ts(r.created_at),
  ];
});

const sql = `BEGIN;

INSERT INTO restaurants (${columns.join(", ")})
VALUES
${rows.map((r) => `(${r.join(", ")})`).join(",\n")}
ON CONFLICT (id) DO NOTHING
RETURNING id;

-- Keep the serial sequence in sync with the highest explicit id we inserted
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), (SELECT MAX(id) FROM restaurants));

COMMIT;
`;

const sqlFile = "/tmp/import-restaurants.sql";
fs.writeFileSync(sqlFile, sql);
console.log(`Wrote ${rows.length} rows to ${sqlFile}`);

const out = execFileSync("psql", [process.env.DATABASE_URL, "-f", sqlFile, "-v", "ON_ERROR_STOP=1"], {
  encoding: "utf8",
  stdio: "pipe",
});
console.log(out);

const afterCount = execFileSync(
  "psql",
  [process.env.DATABASE_URL, "-c", "SELECT COUNT(*) FROM restaurants;", "-t", "-A"],
  { encoding: "utf8", stdio: "pipe" }
);
console.log(`Total restaurants in DB: ${afterCount.trim()}`);

const missing = execFileSync(
  "psql",
  [
    process.env.DATABASE_URL,
    "-c",
    `SELECT id FROM (SELECT unnest(ARRAY[${restaurants.map((r) => r.id).join(",")}]) AS id) AS expected WHERE id NOT IN (SELECT id FROM restaurants WHERE id BETWEEN ${Math.min(...Array.from(REQUIRED_IDS))} AND ${Math.max(...Array.from(REQUIRED_IDS))});`,
    "-t",
    "-A",
  ],
  { encoding: "utf8", stdio: "pipe" }
);
const missingIds = missing.trim().split(/\s+/).filter(Boolean);
if (missingIds.length) {
  console.warn(`Warning: IDs missing from source data or skipped by conflict: ${missingIds.join(",")}`);
} else {
  console.log("All expected IDs are present in the database.");
}
