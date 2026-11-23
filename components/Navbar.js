'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * LPU-Themed Navigation Bar Component
 * Next.js Unit I: Routing & Navigation (usePathname, Link)
 * React Unit II: Functional component design & composition
 * React Unit VI: Global State Management (useAuth Context)
 */
export default function Navbar() {
  const pathname = usePathname();
  const { user, isOrganiser, isAdmin } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      if (!user) {
        setUnreadNotifs(0);
        return;
      }
      try {
        const notifRes = await fetch('/api/notifications');
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (isMounted) setUnreadNotifs(notifData.unreadCount || 0);
        }
      } catch (e) {
        // ignore
      }
    }

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [user, pathname]);

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="site-header">
      {/* LPU Institutional Top Strip */}
      <div className="lpu-top-bar">
        <div className="lpu-top-bar-inner">
          <div className="lpu-brand-text">
            <span className="lpu-badge-pill">LPU</span>
            <span className="lpu-uni-name">Lovely Professional University</span>
            <span className="lpu-sep">|</span>
            <span className="lpu-motto">Transforming Education, Transforming India</span>
          </div>
          <div className="lpu-campus-tag">
            <span>📍 Main Campus • Phagwara, Punjab</span>
          </div>
        </div>
      </div>

      <div className="header-inner">
        <Link href="/" className="brand-logo">
          <span className="lpu-logo-icon">LPU</span>
          <span className="brand-name">Eventra</span>
          <span className="brand-badge">Campus</span>
        </Link>

        <nav className="site-nav">
          <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link
            href="/discover"
            className={`nav-link ${isActive('/discover') ? 'active' : ''}`}
          >
            Discover
          </Link>
          <Link
            href="/calendar"
            className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}
          >
            Calendar
          </Link>
          <Link
            href="/venues"
            className={`nav-link ${isActive('/venues') ? 'active' : ''}`}
          >
            Venues
          </Link>
          <Link
            href="/clash/report"
            className={`nav-link ${isActive('/clash/report') ? 'active' : ''}`}
          >
            Clashes
          </Link>

          {user && (user.role === 'organiser' || user.role === 'admin') && (
            <Link
              href="/my-events"
              className={`nav-link ${isActive('/my-events') ? 'active' : ''}`}
            >
              My Events
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link
              href="/admin"
              className={`nav-link nav-link-admin ${isActive('/admin') ? 'active' : ''}`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-action-group">
              <Link
                href="/notifications"
                className={`notif-btn ${isActive('/notifications') ? 'active' : ''}`}
                title="Notifications"
                aria-label="Notifications"
              >
                <span>🔔</span>
                {unreadNotifs > 0 && (
                  <span className="notif-counter">{unreadNotifs}</span>
                )}
              </Link>
              <Link href="/profile" className="user-profile-pill">
                <span className="user-avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                <span className="user-name">{user.name}</span>
                <span className="user-role-tag">{user.role}</span>
              </Link>
            </div>
          ) : (
            <div className="guest-action-group">
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
