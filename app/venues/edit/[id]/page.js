'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EditVenuePage({ params }) {
  const { id } = params;

  // 1. form fields state
  const [name, setName] = useState('');
  const [type, setType] = useState('Auditorium');
  const [capacity, setCapacity] = useState('100');
  const [location, setLocation] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [availableFrom, setAvailableFrom] = useState('08:00');
  const [availableTo, setAvailableTo] = useState('20:00');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [isActive, setIsActive] = useState(true);

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

  // 3. fetch auth and venue details on mount
  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/users/me');
        if (!userRes.ok) {
          window.location.href = '/login';
          return;
        }
        const userData = await userRes.json();
        if (userData.user.role !== 'admin') {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        setIsAdmin(true);

        const venueRes = await fetch(`/api/venues/${id}`);
        if (!venueRes.ok) {
          setIsError(true);
          setMessage('Venue not found.');
          setIsLoading(false);
          return;
        }

        const data = await venueRes.json();
        const v = data.venue;
        setName(v.name || '');
        setType(v.type || 'Auditorium');
        setCapacity(String(v.capacity || 100));
        setLocation(v.location || '');
        setFacilities(v.facilities || []);
        setAvailableDays(v.availableDays || []);
        setAvailableFrom(v.availableFrom || '08:00');
        setAvailableTo(v.availableTo || '20:00');
        setRequiresApproval(v.requiresApproval !== false);
        setIsActive(v.isActive !== false);
      } catch (err) {
        setIsError(true);
        setMessage('Network error while loading venue.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  function handleFacilityToggle(facility) {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter(f => f !== facility));
    } else {
      setFacilities([...facilities, facility]);
    }
  }

  function handleDayToggle(day) {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  }

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
        isActive,
      };

      const res = await fetch(`/api/venues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Venue updated successfully! Redirecting...');
        setIsError(false);
        setTimeout(() => {
          window.location.href = '/venues';
        }, 1200);
      } else {
        setMessage(data.message || 'Failed to update venue.');
        setIsError(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      setMessage('Network error while updating venue.');
      setIsError(true);
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>Loading venue details...</p>;
  }

  if (!isAdmin) {
    return (
      <div>
        <h2>Access Restricted</h2>
        <p>Only administrators can edit venues.</p>
        <Link href="/venues">← Back to Venues</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Edit College Venue</h2>
      <p>Modify venue settings, capacity, equipment, or active schedule.</p>

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

        <div style={{ marginBottom: '12px' }}>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
            />{' '}
            <strong>Requires Administrator Approval for Bookings</strong>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />{' '}
            <strong>Venue is Active</strong>
          </label>
          <br />
          <small style={{ color: '#64748b' }}>
            If unchecked, this venue cannot be booked or selected for new events.
          </small>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
          <Link href="/venues" style={{ alignSelf: 'center', marginLeft: '8px' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
