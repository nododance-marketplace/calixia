import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = ["/login", "/auth/callback", "/manifest.json", "/favicon.ico"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/brand/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (/\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml|webmanifest)$/i.test(pathname)) return true;
  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authed → bounce to login (except for public paths)
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authed on /login → push to root (which will route by role)
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-aware gating
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ?? "client";

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = role === "trainer" ? "/admin" : "/today";
      return NextResponse.redirect(url);
    }

    if (role === "client" && pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/today";
      return NextResponse.redirect(url);
    }

    if (role === "trainer") {
      const clientOnlyRoots = ["/today", "/calendar", "/workout", "/nutrition", "/messages", "/profile"];
      if (clientOnlyRoots.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
