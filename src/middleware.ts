import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { MESERO_COOKIE, parseCajaSessionCookie } from "@/lib/caja-session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isCajaRoute = pathname.startsWith("/caja");
  const isCajaLogin = pathname === "/caja/login";
  const isCajaRegistro = pathname.startsWith("/caja/registro");
  const session = parseCajaSessionCookie(
    request.cookies.get(MESERO_COOKIE)?.value,
  );

  if (isCajaRoute && !isCajaLogin && !session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/caja/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isCajaRegistro && session?.rol !== "admin") {
    return NextResponse.redirect(new URL("/caja", request.url));
  }

  if (isCajaLogin && session) {
    const next = request.nextUrl.searchParams.get("next") || "/caja";
    // Rutas /admin requieren Supabase Auth; no rebotar solo con cookie de caja.
    if (!next.startsWith("/admin")) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/caja/:path*"],
};
