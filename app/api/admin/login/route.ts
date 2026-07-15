import { NextResponse } from "next/server";
import { adminCookieName, adminPassword, adminSessionValue } from "@/lib/adminAuth";

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/admin";

  return next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const configuredPassword = adminPassword();
  const next = safeNext(formData.get("next"));

  if (!configuredPassword) {
    return NextResponse.redirect(new URL("/admin/login?error=not-configured", request.url), 303);
  }

  if (password !== configuredPassword) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(adminCookieName, await adminSessionValue(), {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
