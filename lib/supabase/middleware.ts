import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/manifest.json", "/favicon.ico"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/brand/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (/\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml|webmanifest)$/i.test(pathname)) return true;
  return false;
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token") && cookie.value) {
      return true;
    }
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authed = hasSupabaseAuthCookie(request);

  if (!authed && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authed && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
