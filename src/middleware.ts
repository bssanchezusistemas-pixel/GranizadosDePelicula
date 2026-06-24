import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { MESERO_COOKIE } from "@/lib/caja-session";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { unsealCajaSession } from "@/lib/session-crypto";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isCajaRoute = pathname.startsWith("/caja");
  const isCajaLogin = pathname === "/caja/login";
  const isCajaRegistro = pathname.startsWith("/caja/registro");
  const isCocinaRoute =
    pathname === "/cocina" || pathname.startsWith("/cocina/");

  const session = await unsealCajaSession(
    request.cookies.get(MESERO_COOKIE)?.value,
  );

  if ((isCajaRoute && !isCajaLogin) || isCocinaRoute) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/caja/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isCajaRegistro && session?.rol !== "admin") {
    return NextResponse.redirect(new URL("/caja", request.url));
  }

  if (isCajaLogin && session) {
    const next = safeRedirectPath(
      request.nextUrl.searchParams.get("next"),
      "/caja",
    );
    if (!next.startsWith("/admin")) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/caja/:path*", "/cocina"],
};
