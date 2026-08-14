import { NextRequest, NextResponse } from "next/server";

import { authConfig, verifySessionToken } from "@/lib/auth";

// Force Node.js runtime so Node crypto (createHmac, Buffer, timingSafeEqual) works correctly.
// Edge runtime does not support these Node.js built-ins used by verifySessionToken.
export const runtime = "nodejs";

const PUBLIC_PATHS = ["/login", "/signup"];
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/register", "/api/auth/logout", "/api/auth/me"];
const ADMIN_ONLY_PATHS = ["/backup", "/api/backup"];

const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.includes(pathname);
};

const isPublicApiPath = (pathname: string): boolean => {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const isAdminOnlyPath = (pathname: string): boolean => {
  return ADMIN_ONLY_PATHS.some((prefix) => pathname.startsWith(prefix));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const rawToken = request.cookies.get(authConfig.sessionCookieName)?.value;

  // Pass public API routes through without auth check
  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  // For public pages (login/signup): redirect authenticated users to dashboard
  if (isPublicPath(pathname)) {
    if (rawToken) {
      const session = await verifySessionToken(rawToken);
      if (session) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // For protected routes: verify token validity before granting access
  if (!rawToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(rawToken);
  if (!session) {
    // Token exists but is invalid or expired — treat as unauthenticated
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only route guard: reject non-admin users from /backup and /api/backup/*
  if (isAdminOnlyPath(pathname) && !session.roles.includes("ADMIN")) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Forbidden — Admin only" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)" ],
};
