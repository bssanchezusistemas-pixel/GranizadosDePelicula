import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { MESERO_COOKIE } from "@/lib/mesero-session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isCajaRoute = pathname.startsWith("/caja");
  const isCajaLogin = pathname === "/caja/login";
  const meseroCookie = request.cookies.get(MESERO_COOKIE)?.value;

  if (isCajaRoute && !isCajaLogin && !meseroCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/caja/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isCajaLogin && meseroCookie) {
    const next = request.nextUrl.searchParams.get("next") || "/caja";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/caja/:path*"],
};
