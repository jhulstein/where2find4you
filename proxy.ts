import { NextResponse, type NextRequest } from "next/server";

const adminCookieName = "where2find4you_admin";

function adminToken() {
  return process.env.ADMIN_ACCESS_TOKEN ??
    process.env.W2F_ADMIN_PASSWORD ??
    process.env.ADMIN_PASSWORD ??
    "";
}

function isAdmin(request: NextRequest) {
  const token = adminToken();

  return Boolean(token && request.cookies.get(adminCookieName)?.value === token);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login") || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (isAdmin(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/analytics/:path*",
    "/api/import/:path*",
  ],
};
