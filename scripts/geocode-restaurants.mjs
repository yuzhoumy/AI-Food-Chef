/**
 * Geocode restaurants with null lat/lon using OSM Nominatim.
 * Run: node scripts/geocode-restaurants.mjs
 */
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

const sql = postgres(DATABASE_URL);

const restaurants = await sql`
  SELECT id, name, address, area FROM restaurants
  WHERE latitude IS NULL OR longitude IS NULL
  ORDER BY id
`;

console.log(`Found ${restaurants.length} restaurants to geocode`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

for (const r of restaurants) {
  const query = encodeURIComponent(`${r.address}, Malaysia`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=my`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "FoodConcierge/1.0 (food-recommendation-app)" },
    });
    const data = await res.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      await sql`UPDATE restaurants SET latitude = ${parseFloat(lat)}, longitude = ${parseFloat(lon)} WHERE id = ${r.id}`;
      console.log(`✓ ${r.name}: ${lat}, ${lon}`);
    } else {
      // Fallback: try just area + Malaysia
      const q2 = encodeURIComponent(`${r.area}, Malaysia`);
      const res2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${q2}&format=json&limit=1`, {
        headers: { "User-Agent": "FoodConcierge/1.0 (food-recommendation-app)" },
      });
      const data2 = await res2.json();
      if (data2.length > 0) {
        const { lat, lon } = data2[0];
        await sql`UPDATE restaurants SET latitude = ${parseFloat(lat)}, longitude = ${parseFloat(lon)} WHERE id = ${r.id}`;
        console.log(`~ ${r.name} (area fallback): ${lat}, ${lon}`);
      } else {
        console.log(`✗ ${r.name}: no result`);
      }
    }
  } catch (err) {
    console.error(`✗ ${r.name}: ${err.message}`);
  }

  // Nominatim rate limit: 1 req/second
  await sleep(1100);
}

await sql.end();
console.log("Done.");
