import { NextResponse } from 'next/server';

/**
 * Middleware to support dual-access to Module 3 (Venue) and Module 4 (Clash) APIs & UI Pages:
 * - Browser requests (Accept: text/html) to /venues, /venues/create, /venues/:id, /clash/report
 *   render the user-friendly frontend pages.
 * - API requests (Accept: application/json, POST, PUT, DELETE, or curl/test clients)
 *   to /venues, /clash/check, /clash/suggestions, /clash/report
 *   are routed directly to the corresponding /api/... handlers.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get('accept') || '';
  const isHtml = accept.includes('text/html');

  // =========================================================================
  // Module 4: Clash Management Dual-Access Routing
  // =========================================================================
  if (pathname === '/clash/report') {
    // If it's a browser requesting HTML, render the Clash Report View UI
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }

    // Otherwise, handle as API request (GET /clash/report via fetch/curl)
    const url = request.nextUrl.clone();
    url.pathname = '/api/clash/report';
    return NextResponse.rewrite(url);
  }

  if (pathname === '/clash/check') {
    const url = request.nextUrl.clone();
    url.pathname = '/api/clash/check';
    return NextResponse.rewrite(url);
  }

  if (pathname === '/clash/suggestions') {
    const url = request.nextUrl.clone();
    url.pathname = '/api/clash/suggestions';
    return NextResponse.rewrite(url);
  }

  // =========================================================================
  // Module 3: Venue Management Dual-Access Routing
  // =========================================================================
  // 1. Root /venues route
  if (pathname === '/venues') {
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = '/api/venues';
    return NextResponse.rewrite(url);
  }

  // 2. Subpaths under /venues/
  if (pathname.startsWith('/venues/')) {
    if (pathname === '/venues/create' || pathname.startsWith('/venues/edit/')) {
      return NextResponse.next();
    }

    if (
      pathname.endsWith('/availability') ||
      pathname.endsWith('/blackouts') ||
      pathname.endsWith('/bookings')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/api' + pathname;
      return NextResponse.rewrite(url);
    }

    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = '/api' + pathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/venues', '/venues/:path*', '/clash', '/clash/:path*'],
};
