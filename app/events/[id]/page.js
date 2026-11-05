'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EventDetailPage({ params }) {
  const { id } = params;

  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Registration & Ticket State (Module 6)
  const [regData, setRegData] = useState({ isRegistered: false, status: null, ticket: null, waitlist: null });
  const [teamSize, setTeamSize] = useState(1);
  const [teamMembers, setTeamMembers] = useState('');
  const [answers, setAnswers] = useState({ rollNo: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleClash, setScheduleClash] = useState(null);

  // Load event details, logged-in user, bookmarks, and registration status
  async function loadData() {
    try {
      const [eventRes, userRes, discRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch('/api/users/me'),
        fetch('/api/discover'),
      ]);

      if (eventRes.ok) {
        const data = await eventRes.json();
        setEvent(data.event);
      }

      let currentUser = null;
      if (userRes.ok) {
        const userData = await userRes.json();
        currentUser = userData.user;
        setUser(currentUser);
      }

      if (discRes.ok) {
        const discData = await discRes.json();
        const found = (discData.events || []).find((e) => e.id === id);
        if (found) {
          setIsBookmarked(Boolean(found.isBookmarked));
        }
      }

      // If user logged in, check their registration status for this event
      if (currentUser) {
        const regRes = await fetch(`/api/events/${id}/register`);
        if (regRes.ok) {
          const regJson = await regRes.json();
          setRegData(regJson);
        }
      }
    } catch (err) {
      // ignore errors
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  // Handle bookmarking
  async function handleBookmark() {
    if (!user) {
      alert('Please log in first to save this event!');
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}/bookmark`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setIsBookmarked(data.isBookmarked);
        setMessage(data.message);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      alert('Failed to update bookmark');
    }
  }

  // Handle One-Click Registration
  async function handleRegister(allowClash = false) {
    if (!user) {
      alert('Please log in first to register for this event!');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setErrorMessage('');
    setScheduleClash(null);

    try {
      const membersList = teamMembers
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const res = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSize: Number(teamSize) || 1,
          teamMembers: membersList,
          answers,
          allowClash,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Registration successful!');
        await loadData();
      } else if (res.status === 409 && data.isClash) {
        // Module 8 Schedule Clash
        setScheduleClash(data);
      } else {
        setErrorMessage(data.error || 'Failed to register.');
      }
    } catch (err) {
      setErrorMessage('Network error while registering.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle One-Click Unregister / Cancellation
  async function handleUnregister() {
    if (!confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/events/${id}/register`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Registration cancelled successfully.');
        await loadData();
      } else {
        setErrorMessage(data.error || 'Failed to cancel registration.');
      }
    } catch (err) {
      setErrorMessage('Network error while cancelling registration.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading event details...</p>;
  }

  if (!event) {
    return (
      <div>
        <h2>Event Not Found</h2>
        <p>This event does not exist or has been removed.</p>
        <Link href="/discover">Back to Discover</Link>
      </div>
    );
  }

  const isOrganiserOrAdmin = user && (user.role === 'admin' || user.id === event.organiserId);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '10px' }}>
      <p>
        <Link href="/discover">← Back to Discover Events</Link>
      </p>

      <h2>{event.title}</h2>

      {message && (
        <div style={{ padding: '10px', background: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '15px' }}>
          <strong>✅ {message}</strong>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '10px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '15px' }}>
          <strong>❌ {errorMessage}</strong>
        </div>
      )}

      {/* Module 8 Schedule Clash Warning Alert */}
      {scheduleClash && (
        <div style={{ padding: '12px', background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', borderRadius: '4px', marginBottom: '15px' }}>
          <h4>⚠️ Module 8 Personal Schedule Clash Detected</h4>
          <p>{scheduleClash.error}</p>
          <p>
            You have a time collision with: <strong>{scheduleClash.conflictingEvent?.title}</strong> ({scheduleClash.conflictingEvent?.startTime} - {scheduleClash.conflictingEvent?.endTime}).
          </p>
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => handleRegister(true)}
              style={{ background: '#e0a800', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
            >
              Confirm Anyway (Override Clash)
            </button>
            <button
              onClick={() => setScheduleClash(null)}
              style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Poster preview if available */}
      {event.poster && (
        <div style={{ marginBottom: '15px' }}>
          <img
            src={event.poster}
            alt={event.title}
            style={{ maxWidth: '300px', maxHeight: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
      )}

      {/* Organiser shortcut button */}
      {isOrganiserOrAdmin && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#e8f4fd', border: '1px solid #b8daff', borderRadius: '4px' }}>
          <strong>Organiser Management:</strong>
          <span style={{ marginLeft: '10px' }}>
            <Link
              href={`/events/${event.id}/attendees`}
              style={{ display: 'inline-block', padding: '6px 12px', background: '#0070f3', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}
            >
              📋 View Attendees, QR Scanner & Export CSV
            </Link>
          </span>
        </div>
      )}

      {/* Event Details Table */}
      <table border="1" cellPadding="8" style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '30%' }}><strong>Description:</strong></td>
            <td>{event.description}</td>
          </tr>
          <tr>
            <td><strong>Category:</strong></td>
            <td>{event.category}</td>
          </tr>
          <tr>
            <td><strong>Date:</strong></td>
            <td>{event.date}</td>
          </tr>
          <tr>
            <td><strong>Time:</strong></td>
            <td>{event.startTime} - {event.endTime}</td>
          </tr>
          <tr>
            <td><strong>Venue:</strong></td>
            <td>{event.venue}</td>
          </tr>
          <tr>
            <td><strong>Organiser / Club:</strong></td>
            <td>{event.clubName || event.organiserName}</td>
          </tr>
          <tr>
            <td><strong>Capacity:</strong></td>
            <td>{event.capacity} seats</td>
          </tr>
          <tr>
            <td><strong>Registration Deadline:</strong></td>
            <td>{event.registrationDeadline}</td>
          </tr>
          <tr>
            <td><strong>Fee / Price:</strong></td>
            <td>{event.isPaid ? `₹${event.ticketPrice}` : 'Free'}</td>
          </tr>
          <tr>
            <td><strong>Cancellation Window:</strong></td>
            <td>Up to {event.cancellationWindowHours || 2} hours before event start</td>
          </tr>
          <tr>
            <td><strong>Tags:</strong></td>
            <td>{Array.isArray(event.tags) ? event.tags.join(', ') : '(None)'}</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td>
              <span style={{ fontWeight: 'bold', color: event.status === 'Published' ? 'green' : 'orange' }}>
                {event.status}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Bookmark Action */}
      <div style={{ marginBottom: '25px' }}>
        <button onClick={handleBookmark} style={{ padding: '6px 14px', cursor: 'pointer' }}>
          {isBookmarked ? 'Saved to Bookmarks ★' : 'Save / Bookmark Event ☆'}
        </button>
      </div>

      {/* ============================================================ */}
      {/* MODULE 6: REGISTRATION & TICKET MANAGEMENT PANEL              */}
      {/* ============================================================ */}
      <div style={{ border: '2px solid #0070f3', borderRadius: '8px', padding: '20px', background: '#fcfcfc', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#0070f3' }}>🎟️ Event Registration & Ticket</h3>

        {!user && (
          <div>
            <p>You need to be logged in to register for campus events.</p>
            <Link
              href="/login"
              style={{ display: 'inline-block', padding: '8px 16px', background: '#0070f3', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}
            >
              Log in to Register
            </Link>
          </div>
        )}

        {user && regData.isRegistered && regData.status === 'Confirmed' && (
          <div>
            <div style={{ padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', marginBottom: '15px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#155724' }}>
                🟢 Registration Confirmed!
              </span>
              <p style={{ margin: '5px 0 0 0' }}>
                You are registered for <strong>{event.title}</strong>. Present your QR code ticket below at entry.
              </p>
            </div>

            {/* QR Ticket Presentation Card */}
            {regData.ticket && (
              <div
                style={{
                  border: '2px dashed #333',
                  borderRadius: '8px',
                  padding: '20px',
                  maxWidth: '380px',
                  background: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  marginBottom: '15px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: '#666' }}>
                  Official Eventra Campus Pass
                </div>
                <h3 style={{ margin: '8px 0 4px 0' }}>{event.title}</h3>
                <div style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>
                  📅 {event.date} | ⏰ {event.startTime} - {event.endTime}
                  <br />
                  📍 {event.venue}
                </div>

                {/* QR Code Image */}
                {regData.ticket.qrCode && (
                  <div style={{ margin: '15px auto' }}>
                    <img
                      src={regData.ticket.qrCode}
                      alt="Ticket QR Code"
                      style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto', border: '1px solid #ddd', padding: '4px' }}
                    />
                  </div>
                )}

                <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', margin: '10px 0' }}>
                  <div style={{ fontSize: '11px', color: '#777' }}>TICKET CODE</div>
                  <strong style={{ fontSize: '16px', letterSpacing: '2px', color: '#111' }}>
                    {regData.ticket.ticketCode}
                  </strong>
                </div>

                <div style={{ fontSize: '13px', textAlign: 'left', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                  <div><strong>Attendee:</strong> {user.name} ({user.email})</div>
                  <div><strong>Team Size:</strong> {regData.registration?.teamSize || 1}</div>
                  <div>
                    <strong>Status:</strong>{' '}
                    {regData.isCheckedIn ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>
                        Checked In ({new Date(regData.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    ) : (
                      <span style={{ color: '#0070f3', fontWeight: 'bold' }}>Active Pass</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 14px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                🖨️ Print Ticket
              </button>
              <button
                onClick={handleUnregister}
                disabled={isSubmitting}
                style={{ padding: '8px 14px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {isSubmitting ? 'Cancelling...' : 'Cancel Registration / Unregister'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Note: Cancellations trigger auto-promotion for the next waitlisted student.
            </p>
          </div>
        )}

        {user && regData.isRegistered && regData.status === 'Waitlisted' && (
          <div>
            <div style={{ padding: '12px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', marginBottom: '15px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#856404' }}>
                🟡 You are on the Waitlist!
              </span>
              <p style={{ margin: '6px 0 0 0' }}>
                Event capacity is full. Your current queue position is: <strong>#{regData.position}</strong>.
              </p>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>
                If an attendee unregisters, our auto-promotion engine will immediately confirm your seat and generate your QR ticket!
              </p>
            </div>

            <button
              onClick={handleUnregister}
              disabled={isSubmitting}
              style={{ padding: '8px 14px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {isSubmitting ? 'Leaving...' : 'Leave Waitlist'}
            </button>
          </div>
        )}

        {user && !regData.isRegistered && (
          <div>
            <p>
              Join <strong>{event.title}</strong> by completing the quick registration below.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister(false);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Team Size:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                />
                <small style={{ color: '#666' }}>Enter 1 for solo participation.</small>
              </div>

              {Number(teamSize) > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Team Member Names / Emails (comma separated):
                  </label>
                  <input
                    type="text"
                    value={teamMembers}
                    onChange={(e) => setTeamMembers(e.target.value)}
                    placeholder="e.g. Aman Gupta, Priya Sen"
                    style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  College Roll / Student ID (Optional):
                </label>
                <input
                  type="text"
                  value={answers.rollNo}
                  onChange={(e) => setAnswers({ ...answers, rollNo: e.target.value })}
                  placeholder="e.g. 21CS084"
                  style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Special Notes / Custom Requirements (Optional):
                </label>
                <input
                  type="text"
                  value={answers.notes}
                  onChange={(e) => setAnswers({ ...answers, notes: e.target.value })}
                  placeholder="e.g. Laptop brought, Dietary preferences"
                  style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || event.status !== 'Published'}
                  style={{
                    padding: '10px 18px',
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    cursor: event.status === 'Published' ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isSubmitting ? 'Processing...' : '⚡ One-Click Register Now'}
                </button>
              </div>

              {event.status !== 'Published' && (
                <p style={{ color: 'red', fontSize: '13px' }}>
                  Registration is currently unavailable because event status is {event.status}.
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
