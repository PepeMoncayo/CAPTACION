import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isRequestAuthenticated } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath =
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (isPublicPath) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  const authed = await isRequestAuthenticated(cookieValue);

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
