import { NextRequest, NextResponse } from "next/server";

const IFRAME_SECRET = process.env.IFRAME_SECRET ?? "ftm-studio-2026";
const IFRAME_COOKIE = "iframe_auth";

export function middleware(request: NextRequest) {
  // Skip API routes, static files, and Next.js internals
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check for token in URL (first visit from iframe)
  const token = request.nextUrl.searchParams.get("token");
  const cookie = request.cookies.get(IFRAME_COOKIE);

  if (token === IFRAME_SECRET) {
    // Valid token — set cookie and strip token from URL
    const url = request.nextUrl.clone();
    url.searchParams.delete("token");
    const response = NextResponse.redirect(url);
    response.cookies.set(IFRAME_COOKIE, "1", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return response;
  }

  // Allow if cookie present
  if (cookie?.value === "1") {
    return NextResponse.next();
  }

  // In development, always allow
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Block with 401 page
  return NextResponse.redirect(new URL("/unauthorized", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
