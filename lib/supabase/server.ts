type SupabaseValue = string | number | boolean | null | string[];
type SupabaseRow = Record<string, SupabaseValue>;

const INSERT_TIMEOUT_MS = 3500;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    return null;
  }

  return { url, secretKey };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

export async function insertSupabaseRows(table: string, rows: SupabaseRow[]) {
  const config = getSupabaseConfig();

  if (!config || rows.length === 0) {
    return { ok: false, skipped: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INSERT_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: config.secretKey,
        authorization: `Bearer ${config.secretKey}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`Supabase insert failed for ${table}: ${response.status} ${details}`);
      return { ok: false, skipped: false };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    console.error(`Supabase insert failed for ${table}`, error);
    return { ok: false, skipped: false };
  } finally {
    clearTimeout(timeout);
  }
}
