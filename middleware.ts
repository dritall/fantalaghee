import { NextRequest, NextResponse } from 'next/server';

const OLD_HOSTS = new Set(['fantalaghee.live', 'www.fantalaghee.live']);
const NEW_DOMAIN = 'fantalaghee.co';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  if (OLD_HOSTS.has(host)) {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${NEW_DOMAIN}`
    );
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
