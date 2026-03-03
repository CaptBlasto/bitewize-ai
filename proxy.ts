import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Always use getUser() — validates the JWT with the Supabase Auth server.
  // Never use getSession() in server code.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Protect /onboarding, /dashboard, /avatar — redirect unauthenticated users to /login
  if (!user && (path.startsWith("/dashboard") || path.startsWith("/onboarding") || path.startsWith("/avatar"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated users accessing /dashboard — enforce onboarding completion
  if (user && path.startsWith("/dashboard")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(new URL("/onboarding/plan", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
