const endpoint = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/import/osm`
  : "http://localhost:3000/api/import/osm";

const payload = {
  areaName: process.env.IMPORT_AREA_NAME ?? "Oslo",
  latitude: Number(process.env.IMPORT_LATITUDE ?? 59.9139),
  longitude: Number(process.env.IMPORT_LONGITUDE ?? 10.7522),
  radiusMeters: Number(process.env.IMPORT_RADIUS_METERS ?? 3000),
  categories: (process.env.IMPORT_CATEGORIES ?? "restaurants,cafes,hotels,attractions")
    .split(",")
    .map((item) => item.trim()),
  limit: Number(process.env.IMPORT_LIMIT ?? 100),
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  throw new Error(`Import failed with status ${response.status}`);
}

console.log(await response.json());
