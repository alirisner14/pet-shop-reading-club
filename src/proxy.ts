import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Runs before every page load. Two jobs:
//   1. Keep the login session fresh so it doesn't expire mid-game.
//   2. Bounce anyone not logged in away from the game pages.

const PROTECTED = ['/profiles', '/menu', '/play', '/practice', '/room'];

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsLogin = PROTECTED.some((p) => path.startsWith(p));

  if (needsLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip static files and images so this doesn't slow the game down.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|audio|.*\\.(?:svg|png|jpg|jpeg|gif|webp|otf|ttf|mp3)$).*)',
  ],
};
