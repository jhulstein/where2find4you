type SupabaseJson =
  | string
  | number
  | boolean
  | null
  | SupabaseJson[]
  | { [key: string]: SupabaseJson };
type SupabaseValue = SupabaseJson;
type SupabaseRow = Record<string, SupabaseValue>;
type SupabaseRpcParams = Record<string, SupabaseValue | undefined>;

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

function cleanRpcParams(params: SupabaseRpcParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
}

export async function callSupabaseRpc<T>(functionName: string, params: SupabaseRpcParams) {
  const config = getSupabaseConfig();

  if (!config) {
    return { data: null as T | null, ok: false, skipped: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INSERT_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        apikey: config.secretKey,
        authorization: `Bearer ${config.secretKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(cleanRpcParams(params)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`Supabase RPC failed for ${functionName}: ${response.status} ${details}`);
      return { data: null as T | null, ok: false, skipped: false };
    }

    return { data: (await response.json()) as T, ok: true, skipped: false };
  } catch (error) {
    console.error(`Supabase RPC failed for ${functionName}`, error);
    return { data: null as T | null, ok: false, skipped: false };
  } finally {
    clearTimeout(timeout);
  }
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
