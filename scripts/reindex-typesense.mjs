import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import {
  createTypesensePlaceDocument,
  TYPESENSE_PLACES_COLLECTION,
  typesensePlacesSchema,
  typesenseSynonyms,
} from "../lib/search/typesenseCore.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedModulePath = path.join(root, "work/generated-places-for-typesense.mjs");
const sourcePath = path.join(root, "lib/data/places.ts");
const args = new Set(process.argv.slice(2));

async function loadEnvFile(filePath) {
  try {
    const contents = await fs.readFile(filePath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^['"]|['"]$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

await loadEnvFile(path.join(root, ".env"));
await loadEnvFile(path.join(root, ".env.local"));

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function typesenseConfig() {
  const host = requiredEnv("TYPESENSE_HOST");
  const apiKey = requiredEnv("TYPESENSE_API_KEY");
  const protocol = process.env.TYPESENSE_PROTOCOL || "http";
  const port = process.env.TYPESENSE_PORT || "8108";

  return {
    apiKey,
    collection: process.env.TYPESENSE_COLLECTION || TYPESENSE_PLACES_COLLECTION,
    origin: `${protocol}://${host}${port ? `:${port}` : ""}`,
  };
}

async function typesenseRequest(pathname, init = {}) {
  const config = typesenseConfig();
  const response = await fetch(`${config.origin}${pathname}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-typesense-api-key": config.apiKey,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Typesense request failed ${response.status}: ${details}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function ensureCollection() {
  const { collection } = typesenseConfig();

  try {
    await typesenseRequest(`/collections/${encodeURIComponent(collection)}`);
    return "existing";
  } catch (error) {
    if (!String(error.message).includes("404")) {
      throw error;
    }
  }

  await typesenseRequest("/collections", {
    body: JSON.stringify({ ...typesensePlacesSchema, name: collection }),
    method: "POST",
  });

  return "created";
}

async function upsertSynonyms() {
  const { collection } = typesenseConfig();

  for (const synonym of typesenseSynonyms) {
    await typesenseRequest(
      `/collections/${encodeURIComponent(collection)}/synonyms/${encodeURIComponent(synonym.id)}`,
      {
        body: JSON.stringify({ synonyms: synonym.synonyms }),
        method: "PUT",
      },
    );
  }
}

async function importDocuments(documents) {
  const { collection } = typesenseConfig();
  const body = documents.map((document) => JSON.stringify(document)).join("\n");
  const response = await fetch(
    `${typesenseConfig().origin}/collections/${encodeURIComponent(collection)}/documents/import?action=upsert`,
    {
      body,
      headers: {
        "content-type": "text/plain",
        "x-typesense-api-key": typesenseConfig().apiKey,
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Typesense import failed ${response.status}: ${await response.text()}`);
  }

  return response.text();
}

function mapSupabasePlace(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    shortDescription: row.short_description,
    address: row.address ?? "",
    city: row.city ?? "",
    country: row.country ?? "",
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    websiteUrl: row.website_url,
    phone: row.phone,
    email: row.email,
    imageUrl: row.image_url,
    source: row.source ?? "manual",
    sourceId: row.source_id,
    tags: row.tags ?? [],
    isSponsored: row.is_sponsored ?? false,
    sponsoredPriority: row.sponsored_priority ?? 0,
    isActive: row.is_active ?? true,
    rating: row.rating === null ? null : Number(row.rating),
    openingHours: row.opening_hours ?? "Hours not provided",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadSeedPlaces() {
  const source = await fs.readFile(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  });

  await fs.mkdir(path.dirname(generatedModulePath), { recursive: true });
  await fs.writeFile(generatedModulePath, transpiled.outputText);

  const generated = await import(`${pathToFileURL(generatedModulePath).href}?v=${Date.now()}`);
  return generated.samplePlaces;
}

async function loadSupabasePlaces() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  const response = await fetch(`${url}/rest/v1/places?select=*&is_active=eq.true&limit=10000`, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase places fetch failed ${response.status}: ${await response.text()}`);
  }

  return (await response.json()).map(mapSupabasePlace);
}

async function loadPlaces() {
  if (args.has("--source=seed")) {
    return { places: await loadSeedPlaces(), source: "seed" };
  }

  const supabasePlaces = args.has("--source=supabase") || !args.has("--source=seed")
    ? await loadSupabasePlaces()
    : null;

  if (supabasePlaces) {
    return { places: supabasePlaces, source: "supabase" };
  }

  return { places: await loadSeedPlaces(), source: "seed" };
}

const { places, source } = await loadPlaces();
const activePlaces = places.filter((place) => place.isActive);
const documents = activePlaces.map((place) => createTypesensePlaceDocument(place));

if (args.has("--dry-run")) {
  console.log(`Would index ${documents.length} ${source} places into ${typesenseConfig().collection}.`);
  console.log(JSON.stringify(documents[0] ?? null, null, 2));
  process.exit(0);
}

const collectionStatus = await ensureCollection();
await upsertSynonyms();
const importResult = await importDocuments(documents);

console.log(`Typesense collection ${collectionStatus}: ${typesenseConfig().collection}`);
console.log(`Indexed ${documents.length} ${source} places.`);
console.log(importResult);
