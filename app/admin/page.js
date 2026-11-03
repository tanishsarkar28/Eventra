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

  // Module 4 Admin Override states
  const [overrideModalEvent, setOverrideModalEvent] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

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
        fetchPendingOrganisers();
      } else {
        setMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      setMessage('Failed to verify organiser');
    }
  }

  // 5. handle approving an event (publishes event after Module 4 venue/time validation)
  async function handleApproveEvent(id, adminOverride = false, reason = '') {
    setEventMessage('');
    setEventError(false);
    try {
      const payload = {
        status: 'Published',
        adminOverride: adminOverride,
        overrideReason: reason,
      };

      const response = await fetch(`/api/events/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setEventMessage(
          adminOverride
            ? `Event approved with Admin Override! Reason: "${reason}"`
            : 'Event approved and published successfully!'
        );
        setEventError(false);
        setOverrideModalEvent(null);
        setOverrideReason('');
        fetchPendingEvents();
      } else {
        setEventMessage(data.message || 'Failed to approve event.');
        setEventError(true);
        // If validation failed with clash, prompt admin if they wish to override
        if (data.canOverride && !adminOverride) {
          const target = pendingEvents.find((e) => e.id === id);
          if (target) {
            setOverrideModalEvent(target);
          }
        }
      }
    } catch (error) {
      setEventMessage('Error approving event.');
      setEventError(true);
    }
  }

  // 6. show loading state
  if (isLoading) {
    return <p>Checking admin permissions...</p>;
  }

  // 7. show access denied if user is not an admin
  if (!isAdmin) {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>This page is only accessible by administrators.</p>
        <Link href="/login">Please login with an admin account</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ margin: 0 }}>Admin Panel</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/clash/report"
            style={{
              padding: '6px 14px',
              background: '#0369a1',
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            🔍 Clash Report View →
          </Link>
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
      </div>

      {/* OVERRIDE MODAL / PROMPT */}
      {overrideModalEvent && (
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', color: '#b45309' }}>
            ⚡ Administrator Override Required
          </h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            Event <strong>&quot;{overrideModalEvent.title}&quot;</strong> has detected scheduling or venue conflicts. As an Administrator, you can override these conflicts by providing an official justification reason:
          </p>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '13px' }}><strong>Admin Override Reason *:</strong></label>
            <br />
            <input
              type="text"
              style={{ width: '100%', maxWidth: '500px', padding: '6px 8px' }}
              placeholder="e.g. Approved by Dean of Student Affairs for Annual Tech Fest"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (!overrideReason.trim()) {
                  alert('Please enter an override reason.');
                  return;
                }
                handleApproveEvent(overrideModalEvent.id, true, overrideReason.trim());
              }}
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Confirm Admin Override &amp; Publish
            </button>
            <button
              onClick={() => {
                setOverrideModalEvent(null);
                setOverrideReason('');
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

      <h3>Pending Events for Approval (Module 2 &amp; 4 Integration)</h3>
      <p><small>Note: Approving an event automatically runs Module 4 interval overlap, capacity, organiser, audience, and blackout validation before publishing.</small></p>

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
              <th>Date &amp; Time</th>
              <th>Venue</th>
              <th>Capacity</th>
              <th>Audience</th>
              <th>Actions</th>
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
                <td>{ev.targetAudience || 'All Students'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleApproveEvent(ev.id, false)}
                      style={{ color: '#16a34a', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Approve &amp; Publish
                    </button>
                    <button
                      onClick={() => {
                        setOverrideModalEvent(ev);
                        setOverrideReason('');
                      }}
                      style={{ color: '#b45309', fontSize: '12px', cursor: 'pointer' }}
                      title="Force-publish with an administrator justification note"
                    >
                      ⚡ Override &amp; Publish
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
