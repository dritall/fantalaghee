import { NextResponse } from 'next/server';

// This function checks if the user has a valid session cookie.
function isValidSession(cookie) {
  if (!cookie) return false;
  try {
    // The cookie value is a Base64 encoded JSON string.
    // e.g., {"loggedIn":true}
    const session = JSON.parse(Buffer.from(cookie.value, 'base64').toString());
    return session.loggedIn === true;
  } catch (e) {
    // If parsing fails, the session is invalid.
    return false;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('auth');
  const userIsAuthenticated = isValidSession(authCookie);

  const isAdminRoute = pathname.startsWith('/admin/');
  const isLoginPage = pathname === '/admin/login.html';

  // Protect all admin routes
  if (isAdminRoute && !isLoginPage) {
    if (!userIsAuthenticated) {
      // If user is not authenticated, redirect to the login page.
      return NextResponse.redirect(new URL('/admin/login.html', request.url));
    }
  }

  // Redirect authenticated users away from the login page
  if (isLoginPage && userIsAuthenticated) {
    // If user is already logged in, redirect them to the admin dashboard.
    return NextResponse.redirect(new URL('/admin/index.html', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// This config specifies that the middleware should run on all routes under /admin/
export const config = {
  matcher: '/admin/:path*',
};
