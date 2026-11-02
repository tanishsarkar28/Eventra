'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EventDetailPage({ params }) {
  const { id } = params;

  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [eventRes, userRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch('/api/users/me'),
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

        // Fetch bookmark status via discover feed or direct check
        const discRes = await fetch(`/api/discover`);
        if (discRes.ok) {
          const discData = await discRes.json();
          const currentInFeed = (discData.events || []).find(e => e.id === id);
          if (currentInFeed) {
            setIsBookmarked(Boolean(currentInFeed.isBookmarked));
            setBookmarkCount(currentInFeed.bookmarkCount || 0);
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  async function handleToggleBookmark() {
    if (!user) {
      alert('Please log in to save or bookmark this event!');
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}/bookmark`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setIsBookmarked(data.isBookmarked);
        setBookmarkCount(data.bookmarkCount);
        setMessage(data.message);
        setTimeout(() => setMessage(''), 2500);
      }
    } catch (e) {
      alert('Failed to update bookmark');
    }
  }

  if (loading) {
    return <p>Loading event details...</p>;
  }

  if (!event) {
    return (
      <div>
        <h2>Event Not Found</h2>
        <p>The requested event could not be found or has been removed.</p>
        <Link href="/discover">← Back to Discover Feed</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/discover">← Back to Discover Events</Link>
      </div>

      {message && (
        <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #bbf7d0', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {/* Main Event Card */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {event.poster && (
          <img
            src={event.poster}
            alt={event.title}
            style={{ width: '100%', maxHeight: '320px', objectFit: 'cover' }}
          />
        )}

        <div style={{ padding: '24px' }}>
          {/* Top meta tags */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#334155' }}>
              {event.category}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '4px', backgroundColor: event.isPaid ? '#fee2e2' : '#dcfce7', color: event.isPaid ? '#991b1b' : '#166534' }}>
              {event.isPaid ? `Paid: ₹${event.ticketPrice}` : 'Free Entry'}
            </span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
              Status: <strong>{event.status}</strong>
            </span>
          </div>

          <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', color: '#0f172a' }}>
            {event.title}
          </h2>

          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-line', marginBottom: '24px' }}>
            {event.description}
          </p>

          {/* Details Table */}
          <table style={{ width: '100%', marginBottom: '24px' }}>
            <tbody>
              <tr>
                <td style={{ width: '30%', fontWeight: 'bold' }}>📅 Event Date</td>
                <td>{event.date}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>⏰ Time</td>
                <td>{event.startTime} - {event.endTime}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>📍 Venue</td>
                <td>{event.venue}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>🏛️ Organized By</td>
                <td>{event.clubName ? `${event.clubName} (${event.organiserName})` : event.organiserName}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>👥 Capacity</td>
                <td>{event.capacity} Attendees</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>⏳ Registration Deadline</td>
                <td>{event.registrationDeadline}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>🏷️ Tags</td>
                <td>
                  {Array.isArray(event.tags) && event.tags.length > 0 ? (
                    event.tags.map(t => (
                      <span key={t} style={{ display: 'inline-block', marginRight: '6px', fontSize: '12px', backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        #{t}
                      </span>
                    ))
                  ) : 'No tags'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleBookmark}
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: isBookmarked ? '#fef3c7' : '#f8fafc',
                borderColor: isBookmarked ? '#f59e0b' : '#cbd5e1',
                color: isBookmarked ? '#b45309' : '#334155',
              }}
            >
              {isBookmarked ? '★ Saved to Bookmarks' : '☆ Save / Bookmark Event'} {bookmarkCount > 0 ? `(${bookmarkCount})` : ''}
            </button>

            <Link
              href="/discover"
              style={{
                padding: '9px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#475569',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
