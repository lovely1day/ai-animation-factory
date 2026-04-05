import { NextRequest, NextResponse } from "next/server";

const IFRAME_SECRET = process.env.IFRAME_SECRET ?? "ftm-studio-2026";
const IFRAME_COOKIE = "iframe_auth";

// Pages that require authentication (CMS/admin only)
const PROTECTED_PATHS = ["/cms"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Public pages — always allow
  // Home, login, create, episodes, projects, unauthorized
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Protected pages (CMS) — check auth
  const token = request.nextUrl.searchParams.get("token");
  const cookie = request.cookies.get(IFRAME_COOKIE);
  const authCookie = request.cookies.get("auth_token");

  // iframe auth (legacy)
  if (token === IFRAME_SECRET) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("token");
    const response = NextResponse.redirect(url);
    response.cookies.set(IFRAME_COOKIE, "1", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 60 * 60 * 8,
    });
    return response;
  }

  // Allow if any auth cookie present
  if (cookie?.value === "1" || authCookie?.value) {
    return NextResponse.next();
  }

  // Development — always allow
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
