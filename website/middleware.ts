import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isMissingRefreshTokenError } from "./lib/supabase/auth-error";

function isSupabaseAuthCookie(name: string): boolean {
  return (
    name.startsWith("sb-") &&
    (name.includes("auth-token") || name.includes("code-verifier"))
  );
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse): void {
  request.cookies.getAll().forEach(({ name }) => {
    if (!isSupabaseAuthCookie(name)) return;
    request.cookies.delete(name);
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  });
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  let user: User | null = null;
  let shouldClearAuthCookies = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      shouldClearAuthCookies = isMissingRefreshTokenError(error);
    } else {
      user = data.user;
    }
  } catch (error) {
    shouldClearAuthCookies = isMissingRefreshTokenError(error);
  }

  if (shouldClearAuthCookies) {
    clearSupabaseAuthCookies(request, supabaseResponse);
  }

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/achievements");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    if (shouldClearAuthCookies) clearSupabaseAuthCookies(request, response);
    return response;
  }

  // Redirect logged-in users away from /login
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
