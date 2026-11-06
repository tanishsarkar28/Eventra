import { NextResponse } from 'next/server';

/**
 * Eventra Dual-Path Middleware
 * 
 * Supports both UI and REST API paths:
 * 1. Module 3: /venues & /venues/:id -> routes HTML to UI page, or JSON/PUT/DELETE to /api/venues
 * 2. Module 4: /clash/check, /clash/suggestions, /clash/report -> routes HTML to page, or JSON to /api/clash
 * 3. Module 2: /events/:id -> routes HTML to UI page (Event Detail / Create / Edit),
 *    or JSON/POST/PUT/DELETE to /api/events handlers.
 * 4. Module 5: /discover -> routes HTML to UI feed, or JSON to /api/discover.
 * 5. Module 6: /attendance/scan -> routes to /api/attendance/scan.
 * 6. Module 7: /notifications -> routes HTML to UI Notifications Center, or API JSON to /api/notifications.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get('accept') || '';
  const isHtml = accept.includes('text/html');

  // =========================================================================
  // Module 7: Notifications & Reminders Dual-Access Routing
  // =========================================================================
  if (pathname === '/notifications') {
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/api/notifications';
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith('/notifications/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/api' + pathname;
    return NextResponse.rewrite(url);
  }

  // =========================================================================
  // Module 4: Clash Management Dual-Access Routing
  // =========================================================================
  if (pathname === '/clash/report') {
    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }
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

  // =========================================================================
  // Module 6: Attendance QR Scan Routing
  // =========================================================================
  if (pathname === '/attendance/scan' || pathname.startsWith('/attendance/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/api' + pathname;
    return NextResponse.rewrite(url);
  }

  // =========================================================================
  // Module 2, 5 & 6: Events, Bookmark & Registration Routing
  // =========================================================================
  if (pathname.startsWith('/events/')) {
    if (pathname === '/events/create' || pathname.startsWith('/events/edit/')) {
      return NextResponse.next();
    }

    if (pathname.endsWith('/attendees')) {
      if (request.method === 'GET' && isHtml) {
        return NextResponse.next();
      }
      const url = request.nextUrl.clone();
      url.pathname = '/api' + pathname;
      return NextResponse.rewrite(url);
    }

    if (pathname.endsWith('/register')) {
      const url = request.nextUrl.clone();
      url.pathname = '/api' + pathname;
      return NextResponse.rewrite(url);
    }

    if (pathname.endsWith('/bookmark')) {
      const url = request.nextUrl.clone();
      url.pathname = '/api' + pathname;
      return NextResponse.rewrite(url);
    }

    if (pathname.endsWith('/status')) {
      const url = request.nextUrl.clone();
      url.pathname = '/api' + pathname;
      return NextResponse.rewrite(url);
    }

    if (pathname === '/events/search') {
      const url = request.nextUrl.clone();
      url.pathname = '/api/events/search';
      return NextResponse.rewrite(url);
    }

    if (request.method === 'GET' && isHtml) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = '/api' + pathname;
    return NextResponse.rewrite(url);
  }

  // =========================================================================
  // Module 5: Discover Routing
  // =========================================================================
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
  matcher: [
    '/venues',
    '/venues/:path*',
    '/clash',
    '/clash/:path*',
    '/events',
    '/events/:path*',
    '/discover',
    '/attendance',
    '/attendance/:path*',
    '/notifications',
    '/notifications/:path*',
  ],
};
