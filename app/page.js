'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Eventra Minimal Landing Page
 * Next.js Unit I: App Router & Navigation
 * React Unit II: Reusable component composition (Card, Badge)
 * React Unit III: useAuth custom hook
 */
export default function HomePage() {
  const { user, loading, isOrganiser, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading campus overview..." />;
  }

  if (user) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ border: 'none', margin: '0 0 4px 0', padding: 0 }}>
              Welcome back, {user.name}
            </h2>
            <p style={{ margin: 0 }}>
              Manage your campus schedule, upcoming events, and club activities.
            </p>
          </div>
          <Badge variant="neutral" dot size="lg">
            {user.role}
          </Badge>
        </div>

        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <Card padding="compact">
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Discover Events</h4>
            <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>
              Browse upcoming college fests, workshops, and hackathons.
            </p>
            <Link href="/discover" className="btn btn-outline btn-sm">
              Explore Feed &rarr;
            </Link>
          </Card>

          <Card padding="compact">
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>My Calendar</h4>
            <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>
              Check weekly agenda, timetable lectures, and free slots.
            </p>
            <Link href="/calendar" className="btn btn-outline btn-sm">
              Open Calendar &rarr;
            </Link>
          </Card>

          <Card padding="compact">
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏛️</div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Campus Venues</h4>
            <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>
              Inspect auditoriums, seminar halls, and availability.
            </p>
            <Link href="/venues" className="btn btn-outline btn-sm">
              View Venues &rarr;
            </Link>
          </Card>
        </div>

        {(isOrganiser || isAdmin) && (
          <Card
            title="Club Organiser Console"
            subtitle="Create and coordinate events for your student organization"
            padding="normal"
          >
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/events/create" className="btn btn-primary btn-sm">
                + Create New Event
              </Link>
              <Link href="/my-events" className="btn btn-outline btn-sm">
                Manage My Events
              </Link>
              <Link href="/clash/report" className="btn btn-ghost btn-sm">
                Run Clash Audit
              </Link>
              {isAdmin && (
                <Link href="/admin" className="btn btn-secondary btn-sm">
                  🛡️ Admin Command Center
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
      <h2 style={{ fontSize: '28px', border: 'none', marginBottom: '12px' }}>
        Eventra Campus Management
      </h2>
      <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
        A lightweight, modern web platform for university event discovery, clash-free scheduling,
        digital QR check-ins, and club coordination.
      </p>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
        <Link href="/discover" className="btn btn-primary btn-lg">
          🔍 Discover Events
        </Link>
        <Link href="/login" className="btn btn-outline btn-lg">
          Log In
        </Link>
        <Link href="/register" className="btn btn-ghost btn-lg">
          Create Account
        </Link>
      </div>

      <div className="grid-3" style={{ textAlign: 'left' }}>
        <Card padding="compact">
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>🛡️ Zero Clashes</h4>
          <p style={{ fontSize: '12.5px', margin: 0 }}>
            Automated conflict detection across 5 distinct campus clash types.
          </p>
        </Card>
        <Card padding="compact">
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>🎟️ QR Check-In</h4>
          <p style={{ fontSize: '12.5px', margin: 0 }}>
            Instant digital ticket generation with real-time gate pass validation.
          </p>
        </Card>
        <Card padding="compact">
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>📅 Timetable Sync</h4>
          <p style={{ fontSize: '12.5px', margin: 0 }}>
            Personal lecture schedule clash alerts and .ics calendar sync.
          </p>
        </Card>
      </div>
    </div>
  );
}
