'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function EditEventPage({ params }) {
  const { id } = params;

  // 1. form fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Students');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('0');
  const [posterUrl, setPosterUrl] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  // 2. auxiliary states
  const [categories, setCategories] = useState([]);
  const [venuesList, setVenuesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 3. Module 4 Real-Time Clash Detection & Suggestions state
  const [clashResult, setClashResult] = useState(null);
  const [isCheckingClash, setIsCheckingClash] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const clashTimerRef = useRef(null);

  // 4. fetch categories, venues, and event details on mount
  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        const vRes = await fetch('/api/venues');
        if (vRes.ok) {
          const vData = await vRes.json();
          setVenuesList(vData.venues || (Array.isArray(vData) ? vData : []));
        }

        const eventRes = await fetch(`/api/events/${id}`);
        if (!eventRes.ok) {
          setIsError(true);
          setMessage('Event not found.');
          setIsLoading(false);
          return;
        }

        const data = await eventRes.json();
        const ev = data.event;

        setTitle(ev.title || '');
        setDescription(ev.description || '');
        setCategory(ev.category || '');
        setTags(Array.isArray(ev.tags) ? ev.tags.join(', ') : '');
        setTargetAudience(ev.targetAudience || 'All Students');
        setDate(ev.date || '');
        setStartTime(ev.startTime || '');
        setEndTime(ev.endTime || '');
        setVenue(ev.venue || '');
        setCapacity(ev.capacity ? ev.capacity.toString() : '100');
        setRegistrationDeadline(ev.registrationDeadline || '');
        setIsPaid(Boolean(ev.isPaid));
        setTicketPrice(ev.ticketPrice ? ev.ticketPrice.toString() : '0');
        setPosterUrl(ev.poster || '');
        setCurrentStatus(ev.status || 'Draft');
      } catch (err) {
        setIsError(true);
        setMessage('Failed to load event data.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  // 5. Module 4: Real-time clash check with debounce
  useEffect(() => {
    if (!date || !startTime || !endTime || !venue) {
      setClashResult(null);
      return;
    }

    if (startTime >= endTime) {
      setClashResult(null);
      return;
    }

    if (clashTimerRef.current) {
      clearTimeout(clashTimerRef.current);
    }

    setIsCheckingClash(true);

    clashTimerRef.current = setTimeout(async () => {
      try {
        const payload = {
          id, // exclude this event from clashing with itself
          venue,
          date,
          startTime,
          endTime,
          capacity: Number(capacity) || 100,
          targetAudience,
          title: title || 'Updated Event',
        };

        const res = await fetch('/api/clash/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          setClashResult(data);
          if (data.hasClash) {
            fetchSuggestions();
          } else {
            setSuggestions(null);
            setShowSuggestions(false);
          }
        }
      } catch (err) {
        console.error('Clash check network error:', err);
      } finally {
        setIsCheckingClash(false);
      }
    }, 400);

    return () => {
      if (clashTimerRef.current) clearTimeout(clashTimerRef.current);
    };
  }, [id, date, startTime, endTime, venue, capacity, targetAudience]);

  async function fetchSuggestions() {
    if (!venue || !date) return;
    try {
      const params = new URLSearchParams({
        venue,
        date,
        startTime: startTime || '10:00',
        endTime: endTime || '12:00',
        capacity: capacity || '100',
        targetAudience: targetAudience || '',
      });

      const res = await fetch(`/api/clash/suggestions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  }

  // 6. handle poster file upload
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setPosterUrl(data.url);
        setMessage('Poster uploaded successfully!');
        setIsError(false);
      } else {
        setMessage(data.message || 'Poster upload failed.');
        setIsError(true);
      }
    } catch (err) {
      setMessage('Failed to upload poster file.');
      setIsError(true);
    } finally {
      setIsUploading(false);
    }
  }

  // 7. handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (startTime >= endTime) {
      setMessage('Start time must be earlier than end time.');
      setIsError(true);
      return;
    }

    if (registrationDeadline && date && registrationDeadline > date) {
      setMessage('Registration deadline cannot be after the event date.');
      setIsError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description,
        category,
        tags,
        targetAudience,
        date,
        startTime,
        endTime,
        venue,
        capacity: Number(capacity),
        registrationDeadline,
        isPaid,
        ticketPrice: isPaid ? Number(ticketPrice) : 0,
        poster: posterUrl,
      };

      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Event updated successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/my-events';
        }, 1200);
      } else {
        setMessage(data.message || 'Failed to update event.');
        setIsError(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      setMessage('Network error while updating event.');
      setIsError(true);
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>Loading event details...</p>;
  }

  return (
    <div>
      <h2>Edit Event: {title}</h2>
      <p>Current Status: <strong>{currentStatus}</strong></p>

      <div style={{ marginBottom: '15px' }}>
        <Link href="/my-events">← Back to My Events</Link>
      </div>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {/* MODULE 4 CLASH DETECTION STATUS */}
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          background: isCheckingClash
            ? '#f8fafc'
            : clashResult && clashResult.hasClash
            ? '#fef2f2'
            : clashResult && !clashResult.hasClash
            ? '#f0fdf4'
            : '#f8fafc',
          borderColor: isCheckingClash
            ? '#cbd5e1'
            : clashResult && clashResult.hasClash
            ? '#fca5a5'
            : clashResult && !clashResult.hasClash
            ? '#86efac'
            : '#e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '15px' }}>
            ⚡ Module 4: Real-Time Clash &amp; Schedule Validator
          </strong>
          {isCheckingClash && (
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Checking schedule conflicts...
            </span>
          )}
        </div>

        {clashResult && !clashResult.hasClash && !isCheckingClash && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>
              ✅ All Clear! No venue, capacity, organiser, audience, or blackout conflicts detected.
            </span>
          </div>
        )}

        {clashResult && clashResult.hasClash && !isCheckingClash && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '14px' }}>
              ⚠️ Conflict Alert: {clashResult.clashCount} Clash(es) Found!
            </span>
            <ul style={{ margin: '6px 0 10px 0', paddingLeft: '20px', fontSize: '13px' }}>
              {clashResult.clashes.map((c, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>
                  <span
                    style={{
                      background: c.severity === 'CRITICAL' ? '#ef4444' : c.severity === 'HIGH' ? '#f97316' : '#eab308',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginRight: '6px',
                    }}
                  >
                    {c.type.toUpperCase()}
                  </span>
                  <strong>{c.title}:</strong> {c.message}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                setShowSuggestions(!showSuggestions);
                if (!suggestions) fetchSuggestions();
              }}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {showSuggestions ? 'Hide Alternatives' : '💡 View Alternative Slots & Venues'}
            </button>
          </div>
        )}

        {showSuggestions && suggestions && (
          <div style={{ marginTop: '15px', padding: '12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <strong style={{ fontSize: '13px' }}>🎯 Recommendations:</strong>
            {suggestions.alternativeSlots && suggestions.alternativeSlots.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>Available Slots Today: </span>
                {suggestions.alternativeSlots.map((slot, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => {
                      setStartTime(slot.startTime);
                      setEndTime(slot.endTime);
                    }}
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      marginRight: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {slot.startTime} - {slot.endTime}
                  </button>
                ))}
              </div>
            )}
            {suggestions.alternativeVenues && suggestions.alternativeVenues.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>Available Alternative Venues: </span>
                {suggestions.alternativeVenues.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVenue(v.name)}
                    style={{
                      background: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      marginRight: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {v.name} (Cap: {v.capacity})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {currentStatus === 'Cancelled' ? (
        <p style={{ color: 'red' }}>
          This event has been cancelled and cannot be edited.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label><strong>Event Title *:</strong></label>
            <br />
            <input
              type="text"
              required
              style={{ width: '100%', maxWidth: '400px' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Description *:</strong></label>
            <br />
            <textarea
              required
              rows="4"
              style={{ width: '100%', maxWidth: '400px' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Category *:</strong></label>
            <br />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Target Audience (Module 4 Audience Clash Check):</strong></label>
            <br />
            <input
              type="text"
              list="audience-suggestions"
              style={{ width: '100%', maxWidth: '400px' }}
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. 3rd-year CSE, 1st-year All, Mechanical Engineering, All Students"
            />
            <datalist id="audience-suggestions">
              <option value="All Students" />
              <option value="3rd-year CSE" />
              <option value="4th-year CSE" />
              <option value="2nd-year CSE" />
              <option value="1st-year All" />
              <option value="Computer Science" />
              <option value="Mechanical Engineering" />
            </datalist>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Tags (comma separated):</strong></label>
            <br />
            <input
              type="text"
              style={{ width: '100%', maxWidth: '400px' }}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Event Date *:</strong></label>
            <br />
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Start Time *:</strong></label>
            <br />
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>End Time *:</strong></label>
            <br />
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Venue *:</strong></label>
            <br />
            <input
              type="text"
              required
              list="venue-suggestions"
              style={{ width: '100%', maxWidth: '400px' }}
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
            <datalist id="venue-suggestions">
              {venuesList.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.type}, Cap: {v.capacity}, {v.location})
                </option>
              ))}
            </datalist>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Capacity *:</strong></label>
            <br />
            <input
              type="number"
              min="1"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Registration Deadline *:</strong></label>
            <br />
            <input
              type="date"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Event Pricing:</strong></label>
            <br />
            <label>
              <input
                type="radio"
                name="pricing"
                checked={!isPaid}
                onChange={() => setIsPaid(false)}
              />{' '}
              Free Event
            </label>
            {'  '}
            <label>
              <input
                type="radio"
                name="pricing"
                checked={isPaid}
                onChange={() => setIsPaid(true)}
              />{' '}
              Paid Event
            </label>
          </div>

          {isPaid && (
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Ticket Price (₹) *:</strong></label>
              <br />
              <input
                type="number"
                min="0"
                required={isPaid}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Event Poster:</strong></label>
            <br />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            {isUploading && <span> Uploading...</span>}
            <br />
            <small>Or enter image URL directly:</small>
            <br />
            <input
              type="text"
              style={{ width: '100%', maxWidth: '400px' }}
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Event'}
            </button>
            <Link href="/my-events" style={{ marginLeft: '10px', alignSelf: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
