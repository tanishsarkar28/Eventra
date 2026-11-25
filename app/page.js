'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks';

/**
 * Eventra @ LPU - Official Lovely Professional University Campus Event Portal
 * Dynamic landing page showcasing LPU campus culture, flagship fests,
 * iconic campus venues (SDM Auditorium, Unipolis, Block 34), and student dashboards.
 */
export default function HomePage() {
  const { user, loading: authLoading, isOrganiser, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function loadCampusData() {
      try {
        const [evRes, vRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/venues?all=true'),
        ]);

        if (evRes.ok) {
          const evData = await evRes.json();
          const pubEvents = (evData.events || []).filter((e) => e.status === 'Published');
          setEvents(pubEvents);
        }

        if (vRes.ok) {
          const vData = await vRes.json();
          setVenues(Array.isArray(vData) ? vData : vData.venues || []);
        }
      } catch (err) {
        // ignore network error
      } finally {
        setLoadingData(false);
      }
    }

    loadCampusData();
  }, []);

  const categories = ['All', 'Technical', 'Cultural', 'Gaming', 'Academic'];

  const filteredEvents = selectedCategory === 'All'
    ? events
    : events.filter((e) => e.category === selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ============================================================
          1. LPU HERO SECTION: BRAND & CAMPUS OVERVIEW
          ============================================================ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px 32px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Decorative LPU Orange Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(241, 90, 36, 0.35) 0%, rgba(241, 90, 36, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 14px 0',
              letterSpacing: '-0.025em',
              color: '#ffffff',
            }}
          >
            Experience Campus Life, Innovation &amp; Culture at <span style={{ color: '#f15a24' }}>LPU</span>
          </h1>

          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#cbd5e1',
              margin: '0 0 24px 0',
              maxWidth: '680px',
            }}
          >
            Transforming Education, Transforming India. Eventra coordinates student club fests, national AI hackathons, dance galas, esports tournaments, and auditorium venue bookings—completely clash-free.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/discover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#f15a24',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14.5px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(241, 90, 36, 0.4)',
              }}
            >
              <span>🔍</span> Explore LPU Events Feed
            </Link>

            {(isOrganiser || isAdmin) ? (
              <Link
                href="/venues"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                <span>🏛️</span> Manage Campus Venues
              </Link>
            ) : (
              <Link
                href="/calendar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                <span>📅</span> Student Schedule &amp; Timetable
              </Link>
            )}

            {!user && (
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 18px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Student / Organiser Login &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Live Campus Metric Bar */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f15a24' }}>30,000+</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Active Students</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8' }}>{events.length} Upcoming</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Flagship Campus Events</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#4ade80' }}>4 Iconic Venues</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>SDM Audi, Unipolis &amp; OAT</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24' }}>100% Verified</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Digital QR Gate Passes</div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. LOGGED-IN STUDENT / ORGANISER PERSONAL CONTROL BAR
          ============================================================ */}
      {user && (
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #fed7aa',
            borderTop: '4px solid #f15a24',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f15a24',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                Welcome back, {user.name}!
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: user.role === 'admin' ? '#fee2e2' : user.role === 'organiser' ? '#e0f2fe' : '#f0fdf4',
                  color: user.role === 'admin' ? '#991b1b' : user.role === 'organiser' ? '#0369a1' : '#15803d',
                  border: user.role === 'admin' ? '1px solid #fca5a5' : user.role === 'organiser' ? '1px solid #bae6fd' : '1px solid #bbf7d0',
                }}
              >
                {user.role}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>
              {user.clubName ? `Club: ${user.clubName} • ` : ''}Manage your registered passes, academic timetable, and upcoming LPU activities.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link
              href="/calendar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#334155',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              📅 {user.role === 'admin' ? 'Master Calendar' : 'My Schedule & Timetable'}
            </Link>

            {user.role === 'organiser' && (
              <Link
                href="/my-events"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#f15a24',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '13px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                🎪 Manage Hosted Events
              </Link>
            )}

            {user.role === 'admin' && (
              <Link
                href="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#ea580c',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '13px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                🛡️ Admin Console
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ============================================================
          3. FEATURED LPU CAMPUS EVENTS SECTION
          ============================================================ */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f15a24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              🔥 What&apos;s Happening at LPU
            </div>
            <h2 style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>
              Upcoming Campus Events &amp; Festivals
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: selectedCategory === cat ? '1px solid #f15a24' : '1px solid #e2e8f0',
                  background: selectedCategory === cat ? '#f15a24' : '#ffffff',
                  color: selectedCategory === cat ? '#ffffff' : '#475569',
                  fontSize: '13px',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎟️</div>
            <h4 style={{ margin: 0, color: '#334155' }}>No {selectedCategory} events scheduled right now.</h4>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '6px 0 16px 0' }}>
              Explore other categories or visit the full discover feed.
            </p>
            <button
              onClick={() => setSelectedCategory('All')}
              style={{ padding: '8px 16px', background: '#f15a24', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Show All Events
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  borderTop: '3.5px solid #f15a24',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Poster Thumbnail */}
                <div style={{ position: 'relative', width: '100%', height: '180px', background: '#0f172a', overflow: 'hidden' }}>
                  {event.poster || event.posterUrl ? (
                    <img
                      src={event.poster || event.posterUrl}
                      alt={event.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      🎪 LPU Campus Event
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    🏷️ {event.category}
                  </span>

                  {/* Price Tag */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      background: event.isPaid ? '#f15a24' : '#16a34a',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    {event.isPaid ? `₹${event.ticketPrice}` : 'FREE ENTRY'}
                  </span>
                </div>

                {/* Event Card Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, lineHeight: 1.35 }}>
                    <Link href={`/events/${event.id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                      {event.title}
                    </Link>
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c2410c', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                    <span>📅 {event.date}</span>
                    <span>•</span>
                    <span>⏰ {event.startTime} - {event.endTime}</span>
                  </div>

                  <div style={{ color: '#64748b', fontSize: '12.5px', marginBottom: '8px' }}>
                    📍 {event.venue}
                  </div>

                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0', flex: 1 }}>
                    {event.description?.length > 90 ? `${event.description.substring(0, 90)}...` : event.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      👥 {event.clubName || event.organiserName || 'LPU Club'}
                    </span>

                    <Link
                      href={`/events/${event.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 14px',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#c2410c',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      View &amp; Register &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================
          4. LPU CAMPUS VENUES & LANDMARK SHOWCASE (ORGANISER / ADMIN ONLY)
          ============================================================ */}
      {(isOrganiser || isAdmin) && (
        <section
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f15a24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                📍 Campus Infrastructure
              </div>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>
                Premier Event Venues at Lovely Professional University
              </h2>
            </div>

            <Link
              href="/venues"
              style={{
                color: '#f15a24',
                fontWeight: 700,
                fontSize: '13.5px',
                textDecoration: 'none',
              }}
            >
              Inspect All Venues &amp; Timings &rarr;
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {venues.map((venue) => (
              <div
                key={venue.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{venue.name}</h4>
                  <span
                    title={
                      venue.requiresApproval
                        ? 'Booking Policy: Club reservations for this venue require administrator clearance before confirmation.'
                        : 'Booking Policy: Reservations for this lab are auto-confirmed instantly.'
                    }
                    style={{
                      fontSize: '11px',
                      background: venue.requiresApproval ? '#fff7ed' : '#f0fdf4',
                      color: venue.requiresApproval ? '#c2410c' : '#15803d',
                      border: venue.requiresApproval ? '1px solid #fed7aa' : '1px solid #bbf7d0',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      cursor: 'help',
                    }}
                  >
                    {venue.requiresApproval ? '🔒 Approval Req' : '⚡ Instant'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  {venue.location}
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#334155', marginBottom: '12px', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>👥 Capacity: <strong>{venue.capacity}</strong></div>
                  <div>🕒 <strong>{venue.availableFrom} - {venue.availableTo}</strong></div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px', flex: 1 }}>
                  {(venue.facilities || []).slice(0, 4).map((f) => (
                    <span key={f} style={{ background: '#f1f5f9', fontSize: '11px', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                      {f}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/venues/${venue.id}`}
                  style={{
                    display: 'inline-block',
                    textAlign: 'center',
                    padding: '6px 12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#1e293b',
                    textDecoration: 'none',
                  }}
                >
                  View Schedule &amp; Book &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}


    </div>
  );
}

