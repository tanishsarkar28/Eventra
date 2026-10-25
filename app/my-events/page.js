'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyEventsPage() {
  // 1. state variables
  const [events, setEvents] = useState([]);
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
      } else {
        setEvents([]);
      }
    } catch (error) {
      setEvents([]);
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

        // only organisers and admins should manage events
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
    return <p>Loading your events...</p>;
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

  // 8. verification warning if organiser is not yet verified
  if (user && user.role === 'organiser' && !user.isVerified) {
    return (
      <div>
        <h2>Account Pending Verification</h2>
        <p>
          Your organiser account has not been verified by an administrator yet.
          You will be able to create and manage events once verified.
        </p>
        <Link href="/profile">Back to Profile</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>My Events Management</h2>
      <p>Manage, edit, publish, or cancel events organized by your club.</p>

      <div style={{ marginBottom: '15px' }}>
        <Link href="/events/create" style={{ display: 'inline-block', padding: '6px 12px', background: '#e0e0e0', textDecoration: 'none', color: '#000', border: '1px solid #999' }}>
          + Create New Event
        </Link>
      </div>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {events.length === 0 ? (
        <p>You have not created any events yet.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ width: '100%', marginTop: '10px' }}>
          <thead>
            <tr>
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
                  {event.poster ? (
                    <img
                      src={event.poster}
                      alt={event.title}
                      style={{ width: '60px', height: '40px', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>No Poster</span>
                  )}
                </td>
                <td>
                  <strong>{event.title}</strong>
                  <br />
                  <small>{event.description ? event.description.substring(0, 40) + '...' : ''}</small>
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
  );
}
