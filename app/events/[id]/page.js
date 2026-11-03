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

  // Load event details & logged-in user
  useEffect(() => {
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

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (discRes.ok) {
          const discData = await discRes.json();
          const found = (discData.events || []).find((e) => e.id === id);
          if (found) {
            setIsBookmarked(Boolean(found.isBookmarked));
          }
        }
      } catch (err) {
        // ignore errors
      } finally {
        setLoading(false);
      }
    }

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

  return (
    <div>
      <p>
        <Link href="/discover">← Back to Discover Events</Link>
      </p>

      <h2>{event.title}</h2>

      {message && (
        <p style={{ color: 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {/* Poster preview if available */}
      {event.poster && (
        <div style={{ marginBottom: '15px' }}>
          <img
            src={event.poster}
            alt={event.title}
            style={{ maxWidth: '300px', maxHeight: '200px', border: '1px solid #ccc' }}
          />
        </div>
      )}

      {/* Details Table */}
      <table border="1" cellPadding="6" style={{ width: '100%', marginBottom: '15px' }}>
        <tbody>
          <tr>
            <td><strong>Description:</strong></td>
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
            <td><strong>Tags:</strong></td>
            <td>{Array.isArray(event.tags) ? event.tags.join(', ') : '(None)'}</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td>{event.status}</td>
          </tr>
        </tbody>
      </table>

      {/* Actions */}
      <div>
        <button onClick={handleBookmark}>
          {isBookmarked ? 'Saved to Bookmarks ★' : 'Save / Bookmark Event ☆'}
        </button>
      </div>
    </div>
  );
}
