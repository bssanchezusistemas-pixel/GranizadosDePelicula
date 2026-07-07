import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_LOGIN = "/admin/login";

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rutas legacy → admin simplificado
  if (pathname === "/caja/login" || pathname === "/admin/login") {
    if (pathname === "/caja/login") {
      return redirectTo(request, ADMIN_LOGIN);
    }
    return updateSession(request);
  }

  if (pathname === "/caja/registro") {
    return redirectTo(request, "/admin/registro");
  }

  const legacyDisabled = [
    "/caja",
    "/caja/mesas",
    "/caja/domicilios",
    "/cocina",
    "/admin/meseros",
    "/admin/mesas",
    "/admin/domicilios",
  ];

  if (
    legacyDisabled.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  ) {
    return redirectTo(request, "/admin/productos");
  }

  if (pathname.startsWith("/admin")) {
    return updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/caja/:path*", "/cocina", "/cocina/:path*"],
};
