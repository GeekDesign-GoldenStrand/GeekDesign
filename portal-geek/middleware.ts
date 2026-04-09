import { type NextRequest, NextResponse } from "next/server";

// Protected admin routes — full RBAC logic goes here in Spike 3
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes require authentication
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("access_token");
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
