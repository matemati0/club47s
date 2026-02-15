import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, resolveAuthMode } from "@/lib/auth";

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const mode = await resolveAuthMode(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    if (mode === "guest") {
      const loginUrl = new URL("/login", request.url);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (mode === "admin") {
      const adminUrl = new URL("/admin", request.url);
      return applySecurityHeaders(NextResponse.redirect(adminUrl));
    }
  }

  if ((pathname === "/login" || pathname === "/register") && mode === "member") {
    const homeUrl = new URL("/", request.url);
    return applySecurityHeaders(NextResponse.redirect(homeUrl));
  }

  if ((pathname === "/login" || pathname === "/register") && mode === "admin") {
    const adminUrl = new URL("/admin", request.url);
    return applySecurityHeaders(NextResponse.redirect(adminUrl));
  }

  if (pathname === "/admin/login" && mode === "admin") {
    const adminUrl = new URL("/admin", request.url);
    return applySecurityHeaders(NextResponse.redirect(adminUrl));
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && mode !== "admin") {
    const adminLoginUrl = new URL("/admin/login", request.url);
    return applySecurityHeaders(NextResponse.redirect(adminLoginUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/", "/login", "/register", "/admin/:path*"]
};
