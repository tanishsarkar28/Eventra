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
    <div style={{ maxWidth: '680px', margin: '40px auto 20px auto', textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: '9999px',
          background: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-secondary)',
          marginBottom: '16px',
          letterSpacing: '0.02em',
        }}
      >
        <span>⚡</span> Campus Event Management System
      </div>
      <h1 style={{ fontSize: '30px', fontWeight: '700', letterSpacing: '-0.025em', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
        Campus Events, Coordinated & Clash-Free
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 auto 28px auto', maxWidth: '520px' }}>
        A modern, minimal web platform for university event discovery, intelligent clash avoidance,
        digital QR check-ins, and club coordination.
      </p>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
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
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>🛡️</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Zero Clashes</h4>
          <p style={{ fontSize: '12.5px', margin: 0, color: 'var(--text-secondary)' }}>
            Automated conflict detection across 5 distinct campus clash types.
          </p>
        </Card>
        <Card padding="compact">
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>🎟️</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>QR Check-In</h4>
          <p style={{ fontSize: '12.5px', margin: 0, color: 'var(--text-secondary)' }}>
            Instant digital ticket generation with real-time gate pass validation.
          </p>
        </Card>
        <Card padding="compact">
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>📅</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Timetable Sync</h4>
          <p style={{ fontSize: '12.5px', margin: 0, color: 'var(--text-secondary)' }}>
            Personal lecture schedule clash alerts and .ics calendar sync.
          </p>
        </Card>
      </div>
    </div>
  );
}
