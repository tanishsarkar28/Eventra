'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  // 1. state variables
  const [organisers, setOrganisers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [eventMessage, setEventMessage] = useState('');
  const [eventError, setEventError] = useState(false);

  // 2. fetch pending organisers from API
  async function fetchPendingOrganisers() {
    try {
      const response = await fetch('/api/organisers/pending');
      if (response.ok) {
        const data = await response.json();
        setOrganisers(data.organisers || []);
      }
    } catch (error) {
      // ignore or handle error
    }
  }

  // fetch pending events from API
  async function fetchPendingEvents() {
    try {
      const response = await fetch('/api/events?status=Pending Approval');
      if (response.ok) {
        const data = await response.json();
        setPendingEvents(data.events || []);
      }
    } catch (error) {
      // ignore or handle error
    }
  }

  // 3. check admin permissions on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role === 'admin') {
            setIsAdmin(true);
            await fetchPendingOrganisers();
            await fetchPendingEvents();
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  // 4. handle clicking the verify button for an organiser
  async function handleVerify(id) {
    setMessage('');
    try {
      const response = await fetch('/api/organisers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Organiser successfully verified!');
        // refresh the pending organisers list
        fetchPendingOrganisers();
      } else {
        setMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      setMessage('Failed to verify organiser');
    }
  }

  // handle approving an event (publishes event after Module 4 venue/time validation)
  async function handleApproveEvent(id) {
    setEventMessage('');
    setEventError(false);
    try {
      const response = await fetch(`/api/events/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Published' }),
      });

      const data = await response.json();

      if (response.ok) {
        setEventMessage('Event approved and published successfully!');
        setEventError(false);
        fetchPendingEvents();
      } else {
        setEventMessage(data.message || 'Failed to approve event.');
        setEventError(true);
      }
    } catch (error) {
      setEventMessage('Error approving event.');
      setEventError(true);
    }
  }

  // 5. show loading state
  if (isLoading) {
    return <p>Checking admin permissions...</p>;
  }

  // 6. show access denied if user is not an admin
  if (!isAdmin) {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>This page is only accessible by administrators.</p>
        <Link href="/login">Please login with an admin account</Link>
      </div>
    );
  }

  // 7. render pending organisers table
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Admin Panel</h2>
        <Link
          href="/venues"
          style={{
            padding: '6px 14px',
            background: '#2563eb',
            color: '#ffffff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Manage Venues &amp; Schedules →
        </Link>
      </div>

      <h3>Pending Organisers</h3>
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {organisers.length === 0 ? (
        <p>No pending organisers waiting for verification.</p>
      ) : (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Club Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {organisers.map((org) => (
              <tr key={org.id}>
                <td>{org.id}</td>
                <td>{org.name}</td>
                <td>{org.email}</td>
                <td>{org.clubName}</td>
                <td>
                  <button onClick={() => handleVerify(org.id)}>
                    Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr style={{ margin: '30px 0' }} />

      <h3>Pending Events for Approval (Module 2 & 4 Integration)</h3>
      <p><small>Note: Approving an event validates venue and schedule with Module 4 before publishing.</small></p>

      {eventMessage && (
        <p style={{ color: eventError ? 'red' : 'green', fontWeight: 'bold' }}>
          {eventMessage}
        </p>
      )}

      {pendingEvents.length === 0 ? (
        <p>No events currently pending admin approval.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Club / Organiser</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Capacity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingEvents.map((ev) => (
              <tr key={ev.id}>
                <td><strong>{ev.title}</strong></td>
                <td>{ev.clubName || ev.organiserName}</td>
                <td>{ev.date} ({ev.startTime} - {ev.endTime})</td>
                <td>{ev.venue}</td>
                <td>{ev.capacity}</td>
                <td>
                  <button onClick={() => handleApproveEvent(ev.id)} style={{ color: 'green' }}>
                    Approve & Publish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
