'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CreateVenuePage() {
  // 1. form fields state
  const [name, setName] = useState('');
  const [type, setType] = useState('Auditorium');
  const [capacity, setCapacity] = useState('100');
  const [location, setLocation] = useState('');
  const [facilities, setFacilities] = useState(['AC', 'Projector', 'Microphone']);
  const [availableDays, setAvailableDays] = useState([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]);
  const [availableFrom, setAvailableFrom] = useState('08:00');
  const [availableTo, setAvailableTo] = useState('20:00');
  const [requiresApproval, setRequiresApproval] = useState(true);

  // 2. auxiliary state
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const venueTypes = [
    'Auditorium',
    'Seminar Hall',
    'Lab',
    'Playground',
    'Conference Room',
    'Classroom',
    'Open Air Theatre',
    'Sports Complex',
  ];

  const standardFacilities = [
    'AC',
    'Projector',
    'Microphone',
    'Sound System',
    'WiFi',
    'Whiteboard',
    'Video Conferencing',
    'Stage Lighting',
  ];

  const allDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  // 3. check admin auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          window.location.href = '/login';
        }
      } catch (err) {
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  // 4. toggle facility checkbox
  function handleFacilityToggle(facility) {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter(f => f !== facility));
    } else {
      setFacilities([...facilities, facility]);
    }
  }

  // 5. toggle day checkbox
  function handleDayToggle(day) {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  }

  // 6. handle submit
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (Number(capacity) <= 0) {
      setMessage('Capacity must be a positive number.');
      setIsError(true);
      return;
    }

    if (availableFrom >= availableTo) {
      setMessage('Opening time must be earlier than closing time.');
      setIsError(true);
      return;
    }

    if (availableDays.length === 0) {
      setMessage('Please select at least one available day.');
      setIsError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name,
        type,
        capacity: Number(capacity),
        location,
        facilities,
        availableDays,
        availableFrom,
        availableTo,
        requiresApproval,
      };

      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Venue created successfully! Redirecting...');
        setIsError(false);
        setTimeout(() => {
          window.location.href = '/venues';
        }, 1200);
      } else {
        setMessage(data.message || 'Failed to create venue.');
        setIsError(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      setMessage('Network error while creating venue.');
      setIsError(true);
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>Checking permissions...</p>;
  }

  if (!isAdmin) {
    return (
      <div>
        <h2>Access Restricted</h2>
        <p>Only administrators can add new venues.</p>
        <Link href="/venues">← Back to Venues</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Add New College Venue</h2>
      <p>Configure a campus venue, its capacity, facilities, and operating schedule.</p>

      <div style={{ marginBottom: '15px' }}>
        <Link href="/venues">← Back to Venues</Link>
      </div>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label><strong>Venue Name *:</strong></label>
          <br />
          <input
            type="text"
            required
            style={{ width: '100%', maxWidth: '400px' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Raman Auditorium, CS Lab 2, Main Ground"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label><strong>Venue Type *:</strong></label>
          <br />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ minWidth: '220px' }}
          >
            {venueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label><strong>Seating / Crowd Capacity *:</strong></label>
          <br />
          <input
            type="number"
            required
            min="1"
            style={{ width: '150px' }}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label><strong>Location / Campus Block *:</strong></label>
          <br />
          <input
            type="text"
            required
            style={{ width: '100%', maxWidth: '400px' }}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Block B, 2nd Floor, Near Central Library"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label><strong>Available Facilities:</strong></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginTop: '6px', maxWidth: '500px' }}>
            {standardFacilities.map((fac) => (
              <label key={fac} style={{ fontWeight: 'normal', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={facilities.includes(fac)}
                  onChange={() => handleFacilityToggle(fac)}
                />{' '}
                {fac}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label><strong>Available Days of Week:</strong></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
            {allDays.map((d) => (
              <label key={d} style={{ fontWeight: 'normal', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={availableDays.includes(d)}
                  onChange={() => handleDayToggle(d)}
                />{' '}
                {d.substring(0, 3)}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div>
            <label><strong>Opening Time *:</strong></label>
            <br />
            <input
              type="time"
              required
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
          </div>
          <div>
            <label><strong>Closing Time *:</strong></label>
            <br />
            <input
              type="time"
              required
              value={availableTo}
              onChange={(e) => setAvailableTo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
            />{' '}
            <strong>Requires Administrator Approval for Bookings</strong>
          </label>
          <br />
          <small style={{ color: '#64748b' }}>
            If checked, event bookings for this venue will stay &quot;Pending&quot; until an admin approves them.
          </small>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Venue...' : 'Create Venue'}
          </button>
          <Link href="/venues" style={{ alignSelf: 'center', marginLeft: '8px' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
