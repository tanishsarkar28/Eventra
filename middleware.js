import { NextResponse } from 'next/server';

/**
 * Middleware to support dual-access to Module 3 Venue APIs and UI Pages:
 * - Browser requests (Accept: text/html) to /venues, /venues/create, /venues/edit/:id, /venues/:id
 *   render the user-friendly frontend pages.
 * - API requests (Accept: application/json, POST, PUT, DELETE, or curl/test clients)
 *   to /venues, /venues/:id/availability, /venues/:id/blackouts, etc.
 *   are routed directly to the corresponding /api/venues handlers.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get('accept') || '';
  const isHtml = accept.includes('text/html');

  // 1. Root /venues route
  if (pathname === '/venues') {
    // If it's a browser requesting HTML, render the Venue Dashboard UI
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }

    // Otherwise, handle as API request (e.g. POST /venues or GET /venues via fetch/curl)
    const url = request.nextUrl.clone();
    url.pathname = '/api/venues';
    return NextResponse.rewrite(url);
  }

  // 2. Subpaths under /venues/
  if (pathname.startsWith('/venues/')) {
    // Allow explicit UI pages through
    if (pathname === '/venues/create' || pathname.startsWith('/venues/edit/')) {
      return NextResponse.next();
    }

    // Sub-resource API endpoints: /venues/:id/availability, /venues/:id/blackouts, /venues/:id/bookings
    if (
      pathname.endsWith('/availability') ||
      pathname.endsWith('/blackouts') ||
      pathname.endsWith('/bookings')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/api' + pathname;
      return NextResponse.rewrite(url);
    }

    // For /venues/:id:
    // If browser requesting HTML, render the Venue Detail UI page
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }

    // Otherwise handle as API (GET /venues/:id, PUT /venues/:id, DELETE /venues/:id)
    const url = request.nextUrl.clone();
    url.pathname = '/api' + pathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/venues', '/venues/:path*'],
};
