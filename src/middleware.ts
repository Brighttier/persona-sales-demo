
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const personaAiUserCookie = request.cookies.get('persona-ai-user'); // Updated cookie name
  const { pathname } = request.nextUrl;

  // If trying to access any /dashboard/* route
  if (pathname.startsWith('/dashboard')) {
    if (!personaAiUserCookie) {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // User is authenticated, allow access.
    // More specific role-based path protection could be added here if needed,
    // but for now, client-side checks in layout handle mismatch redirection.
  }

  // If authenticated and trying to access /login
  if (personaAiUserCookie && pathname === '/login') {
    try {
        const user = JSON.parse(decodeURIComponent(personaAiUserCookie.value)); // Ensure cookie value is decoded
        if (user && user.role) {
            return NextResponse.redirect(new URL(`/dashboard/${user.role}/dashboard`, request.url));
        }
    } catch (e) {
        // Invalid cookie, let them go to login
        console.error("Error parsing user cookie in middleware:", e);
        // Optionally clear the bad cookie
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('persona-ai-user', '', { path: '/', maxAge: 0 });
        return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets like images under /
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
