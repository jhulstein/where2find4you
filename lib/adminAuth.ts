export const adminCookieName = "where2find4you_admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function adminSessionValue() {
  const password = adminPassword();

  if (!password) {
    return "";
  }

  return sha256(`where2find4you-admin:${password}`);
}

export async function isAdminSession(value: string | undefined) {
  const expected = await adminSessionValue();

  return Boolean(expected && value === expected);
}
