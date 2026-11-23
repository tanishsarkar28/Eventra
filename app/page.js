'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Eventra @ LPU Landing Page & Student/Organiser Dashboard
 * Next.js Unit I: App Router & Navigation
 * React Unit II: Reusable component composition (Card, Badge)
 * React Unit III: useAuth custom hook
 */
export default function HomePage() {
  const { user, loading, isOrganiser, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading LPU campus overview..." />;
  }

  if (user) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#c2410c', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>🏫</span> Lovely Professional University Campus
            </div>
            <h2 style={{ border: 'none', margin: '0 0 4px 0', padding: 0 }}>
              Welcome back, {user.name}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {user.clubName ? `${user.clubName} • ` : ''}Manage your LPU schedule, upcoming campus events, and timetable slots.
            </p>
          </div>
          <Badge variant="primary" dot size="lg">
            {user.role}
          </Badge>
        </div>

        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <Card padding="compact">
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Discover Events</h4>
            <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>
              Browse upcoming LPU college fests, technical hackathons, and dance nights.
            </p>
            <Link href="/discover" className="btn btn-outline btn-sm">
              Explore Feed &rarr;
            </Link>
          </Card>

          <Card padding="compact">
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>My Calendar</h4>
            <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>
              Check weekly agenda, timetable lectures, and free slots without lecture clashes.
            </p>
            <Link href="/calendar" className="btn btn-outline btn-sm">
              Open Calendar &rarr;
            </Link>
          </Card>

          <Card padding="compact">
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏛️</div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>LPU Venues</h4>
            <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>
              Inspect SDM Auditorium, Unipolis, Block 34 Tech Centers, and OAT availability.
            </p>
            <Link href="/venues" className="btn btn-outline btn-sm">
              View Venues &rarr;
            </Link>
          </Card>
        </div>

        {(isOrganiser || isAdmin) && (
          <Card
            title="Club Organiser Console"
            subtitle={`Create and coordinate events for ${user.clubName || 'your student organization'}`}
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
          padding: '3px 12px',
          borderRadius: '9999px',
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          fontSize: '12px',
          fontWeight: '700',
          color: '#c2410c',
          marginBottom: '16px',
          letterSpacing: '0.02em',
        }}
      >
        <span>🏫</span> Lovely Professional University • Eventra Campus Portal
      </div>
      <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.025em', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
        LPU Campus Events, Coordinated &amp; Clash-Free
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 auto 28px auto', maxWidth: '540px' }}>
        The official university web platform for student club fests, technical hackathons,
        intelligent venue clash avoidance, and digital QR check-in passes at Lovely Professional University.
      </p>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
        <Link href="/discover" className="btn btn-primary btn-lg">
          🔍 Discover LPU Events
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
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Zero Venue Clashes</h4>
          <p style={{ fontSize: '12.5px', margin: 0, color: 'var(--text-secondary)' }}>
            Real-time conflict detection across SDM Audi, Unipolis, and Block 34 Tech Labs.
          </p>
        </Card>
        <Card padding="compact">
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>🎟️</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Digital QR Pass</h4>
          <p style={{ fontSize: '12.5px', margin: 0, color: 'var(--text-secondary)' }}>
            Instant digital ticket generation with scannable QR verification for campus gate entry.
          </p>
        </Card>
        <Card padding="compact">
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>📅</div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>LPU Timetable Sync</h4>
          <p style={{ fontSize: '12.5px', margin: 0, color: 'var(--text-secondary)' }}>
            Personal lecture schedule clash alerts and .ics sync for university classes.
          </p>
        </Card>
      </div>
    </div>
  );
}
