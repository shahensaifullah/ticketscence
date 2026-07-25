import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REFRESH_COOKIE_NAME = "ticketsense_refresh";

function hasUnexpiredRefreshToken(token?: string) {
  if (!token) {
    return false;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return false;
    }

    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown };

    return (
      typeof decoded.exp === "number" &&
      decoded.exp * 1000 > Date.now()
    );
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (hasUnexpiredRefreshToken(refreshToken)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const response = NextResponse.redirect(loginUrl);
  if (refreshToken) {
    response.cookies.delete(REFRESH_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: [
    "/analytics/:path*",
    "/assistant/:path*",
    "/board/:path*",
    "/dashboard/:path*",
    "/data/:path*",
    "/my-work/:path*",
    "/notifications/:path*",
    "/projects/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/tickets/:path*",
  ],
};
