'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyEventsPage() {
  // 1. state variables
  const [events, setEvents] = useState([]);
  const [bookedEvents, setBookedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('hosting'); // 'hosting' | 'booked'
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // 2. fetch events for currently logged-in organiser
  async function fetchMyEvents() {
    try {
      const response = await fetch('/api/events/mine');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setBookedEvents(data.bookedEvents || []);
      } else {
        setEvents([]);
        setBookedEvents([]);
      }
    } catch (error) {
      setEvents([]);
      setBookedEvents([]);
    }
  }

  // 3. check auth and load events on mount
  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/users/me');
        if (!userRes.ok) {
          window.location.href = '/login';
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        // only organisers and admins should access organiser dashboard
        if (userData.user.role !== 'organiser' && userData.user.role !== 'admin') {
          setIsLoading(false);
          return;
        }

        await fetchMyEvents();
      } catch (error) {
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // 4. handle cancelling an event
  async function handleCancel(eventId) {
    if (!confirm('Are you sure you want to cancel this event?')) {
      return;
    }

    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Event cancelled successfully.');
        fetchMyEvents();
      } else {
        setIsError(true);
        setMessage(data.message || 'Failed to cancel event.');
      }
    } catch (error) {
      setIsError(true);
      setMessage('Network error while cancelling event.');
    }
  }

  // 5. handle changing status (e.g. Submit for Approval or Withdraw to Draft)
  async function handleStatusChange(eventId, newStatus) {
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Event status changed to: ${newStatus}`);
        fetchMyEvents();
      } else {
        setIsError(true);
        setMessage(data.message || 'Failed to update event status.');
      }
    } catch (error) {
      setIsError(true);
      setMessage('Network error while updating status.');
    }
  }

  // 6. show loading state
  if (isLoading) {
    return <p>Loading your events dashboard...</p>;
  }

  // 7. permission warning if user is not organiser
  if (user && user.role !== 'organiser' && user.role !== 'admin') {
    return (
      <div>
        <h2>Access Restricted</h2>
        <p>Only event organisers can access event management.</p>
        <Link href="/profile">Back to Profile</Link>
      </div>
    );
  }

  // 8. admin gateway redirection
  if (user && user.role === 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '42px', marginBottom: '12px' }}>🛡️</div>
        <h2 style={{ border: 'none', margin: '0 0 8px 0', padding: 0 }}>
          Administrator Command Center
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          You are signed in as a <strong>University Administrator</strong>. Club organisers manage their individual club events here, while university-wide event approvals, clash overrides, and venue moderation are handled in the Admin Command Center.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
            🛡️ Open Admin Command Center &rarr;
          </Link>
          <Link href="/discover" className="btn btn-outline btn-lg" style={{ textDecoration: 'none' }}>
            Browse Campus Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0' }}>Organiser Event Dashboard</h2>
          <p style={{ margin: 0, color: '#555' }}>
            Manage events organized by {user?.clubName || 'your club'}, or access your personal booked tickets for other campus events.
          </p>
        </div>
        {user?.isVerified && (
          <Link
            href="/events/create"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#0070f3',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            + Create New Event
          </Link>
        )}
      </div>

      {user?.role === 'organiser' && !user?.isVerified && (
        <div style={{ padding: '12px 16px', background: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', borderRadius: '6px', marginBottom: '16px' }}>
          ⚠️ <strong>Club Account Verification Pending:</strong> Your organiser account is awaiting administrator approval before you can publish events. You can still book tickets for any campus event below!
        </div>
      )}

      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('hosting')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'hosting' ? 700 : 500,
            border: 'none',
            borderBottom: activeTab === 'hosting' ? '3px solid #0070f3' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'hosting' ? '#0070f3' : '#64748b',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          🎪 Hosted by My Club ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('booked')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'booked' ? 700 : 500,
            border: 'none',
            borderBottom: activeTab === 'booked' ? '3px solid #0070f3' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'booked' ? '#0070f3' : '#64748b',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          🎟️ My Booked Tickets & Passes ({bookedEvents.length})
        </button>
      </div>

      {/* Tab 1: Hosted Events */}
      {activeTab === 'hosting' && (
        <div>
          {events.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 12px 0', color: '#64748b' }}>Your club has not created any events yet.</p>
              {user?.isVerified ? (
                <Link
                  href="/events/create"
                  style={{ display: 'inline-block', padding: '6px 14px', background: '#0070f3', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}
                >
                  Create Your First Event
                </Link>
              ) : (
                <span style={{ color: '#94a3b8' }}>Verification required to publish new events.</span>
              )}
            </div>
          ) : (
            <table border="1" cellPadding="6" style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th>Poster</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Capacity</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td style={{ textAlign: 'center' }}>
                      {(event.poster || event.posterUrl) ? (
                        <img
                          src={event.poster || event.posterUrl}
                          alt={event.title}
                          style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>No Poster</span>
                      )}
                    </td>
                    <td>
                      <strong>{event.title}</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>{event.description ? event.description.substring(0, 40) + '...' : ''}</small>
                    </td>
                    <td>{event.category}</td>
                    <td>
                      {event.date}
                      <br />
                      <small>{event.startTime} - {event.endTime}</small>
                    </td>
                    <td>{event.venue}</td>
                    <td>{event.capacity}</td>
                    <td>{event.isPaid ? `₹${event.ticketPrice}` : 'Free'}</td>
                    <td>
                      <strong>
                        {event.status === 'Published' && <span style={{ color: 'green' }}>Published</span>}
                        {event.status === 'Pending Approval' && <span style={{ color: 'orange' }}>Pending Approval</span>}
                        {event.status === 'Draft' && <span style={{ color: 'gray' }}>Draft</span>}
                        {event.status === 'Cancelled' && <span style={{ color: 'red' }}>Cancelled</span>}
                      </strong>
                    </td>
                    <td>
                      {event.status !== 'Cancelled' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <Link href={`/events/edit/${event.id}`}>
                            Edit
                          </Link>

                          {event.status === 'Published' && (
                            <Link
                              href={`/events/${event.id}/attendees`}
                              style={{ color: '#0070f3', fontWeight: 'bold' }}
                            >
                              📋 Attendees & QR
                            </Link>
                          )}

                          {event.status === 'Draft' && (
                            <button onClick={() => handleStatusChange(event.id, 'Pending Approval')}>
                              Submit for Approval
                            </button>
                          )}

                          {event.status === 'Pending Approval' && (
                            <button onClick={() => handleStatusChange(event.id, 'Draft')}>
                              Withdraw to Draft
                            </button>
                          )}

                          <button onClick={() => handleCancel(event.id)} style={{ color: 'red' }}>
                            Cancel Event
                          </button>
                        </div>
                      )}
                      {event.status === 'Cancelled' && <em>Cancelled</em>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Booked Tickets for Other Events */}
      {activeTab === 'booked' && (
        <div>
          {bookedEvents.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#475569' }}>
                You have not booked tickets for any events yet.
              </p>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                As an organiser, you can freely explore and register for events hosted by other campus clubs!
              </p>
              <Link
                href="/discover"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#0070f3',
                  color: '#fff',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                🔍 Browse & Book Events
              </Link>
            </div>
          ) : (
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th>Poster</th>
                  <th>Event & Organiser</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Ticket Code</th>
                  <th>Pass Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookedEvents.map((ev) => (
                  <tr key={ev.registrationId || ev.id}>
                    <td style={{ textAlign: 'center', width: '70px' }}>
                      {(ev.poster || ev.posterUrl) ? (
                        <img
                          src={ev.poster || ev.posterUrl}
                          alt={ev.title}
                          style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>No Poster</span>
                      )}
                    </td>
                    <td>
                      <strong>{ev.title}</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>Organised by: {ev.clubName || ev.organiserName || 'Campus Club'}</small>
                    </td>
                    <td>
                      {ev.date}
                      {ev.startTime && (
                        <>
                          <br />
                          <small>{ev.startTime} - {ev.endTime}</small>
                        </>
                      )}
                    </td>
                    <td>{ev.venue}</td>
                    <td>
                      {ev.ticket?.ticketCode ? (
                        <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {ev.ticket.ticketCode}
                        </code>
                      ) : (
                        <span style={{ color: '#64748b' }}>Confirmed</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                        ● Confirmed Entry
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/events/${ev.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          background: '#0070f3',
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        🎟️ View QR Pass
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
