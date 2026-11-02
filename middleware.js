import { NextResponse } from 'next/server';

/**
 * Eventra Dual-Path Middleware
 * 
 * Supports both UI and REST API paths:
 * 1. /venues and /venues/:id -> routes HTML to UI page, or JSON/PUT/DELETE to /api/venues
 * 2. /events and /events/:id -> routes HTML to UI page (Event Detail / Create / Edit),
 *    or JSON/POST/PUT/DELETE to /api/events handlers.
 * 3. /discover -> routes HTML to UI feed, or JSON to /api/discover.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get('accept') || '';
  const isHtml = accept.includes('text/html');

  // ==========================================================
  // A. VENUES ROUTING
  // ==========================================================
  if (pathname === '/venues') {
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/api/venues';
    return NextResponse.rewrite(url);
  }

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

  // ==========================================================
  // B. EVENTS ROUTING (/events/:id, /events/:id/bookmark)
  // ==========================================================
  if (pathname.startsWith('/events/')) {
    // UI creation & editing pages stay as HTML pages
    if (pathname === '/events/create' || pathname.startsWith('/events/edit/')) {
      return NextResponse.next();
    }

    // Bookmark API endpoint: /events/:id/bookmark
    if (pathname.endsWith('/bookmark')) {
      const url = request.nextUrl.clone();
      url.pathname = '/api' + pathname;
      return NextResponse.rewrite(url);
    }

    // Status endpoint: /events/:id/status
    if (pathname.endsWith('/status')) {
      const url = request.nextUrl.clone();
      url.pathname = '/api' + pathname;
      return NextResponse.rewrite(url);
    }

    // Search endpoint: /events/search
    if (pathname === '/events/search') {
      const url = request.nextUrl.clone();
      url.pathname = '/api/events/search';
      return NextResponse.rewrite(url);
    }

    // For /events/:id
    // If browser requesting HTML page -> serve app/events/[id]/page.js (Event Detail)
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }

    // If API client (fetch/POST/PUT/DELETE) -> rewrite to /api/events/:id
    const url = request.nextUrl.clone();
    url.pathname = '/api' + pathname;
    return NextResponse.rewrite(url);
  }

  // ==========================================================
  // C. DISCOVER ROUTING (/discover)
  // ==========================================================
  if (pathname === '/discover') {
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/api/discover';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/venues', '/venues/:path*', '/events', '/events/:path*', '/discover'],
};
