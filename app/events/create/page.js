'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function CreateEventPage() {
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

  // 2. auxiliary states
  const [categories, setCategories] = useState([]);
  const [venuesList, setVenuesList] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 3. Module 4 Real-Time Clash Detection & Suggestions state
  const [clashResult, setClashResult] = useState(null);
  const [isCheckingClash, setIsCheckingClash] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const clashTimerRef = useRef(null);

  // 4. fetch categories and venues on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          if (data.categories && data.categories.length > 0) {
            setCategory(data.categories[0]);
          }
        }
      } catch (err) {
        setCategories(['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar']);
        setCategory('Technical');
      }

      try {
        const vRes = await fetch('/api/venues');
        if (vRes.ok) {
          const vData = await vRes.json();
          setVenuesList(vData.venues || (Array.isArray(vData) ? vData : []));
        }
      } catch (vErr) {
        // ignore
      }
    }
    loadInitialData();
  }, []);

  // 5. Module 4: Real-time clash check with debounce
  useEffect(() => {
    // Only check if user has filled at least date, times, and venue
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
          venue,
          date,
          startTime,
          endTime,
          capacity: Number(capacity) || 100,
          targetAudience,
          title: title || 'New Event Draft',
        };

        const res = await fetch('/api/clash/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          setClashResult(data);
          // If clashes detected, automatically preload suggestions
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
    }, 400); // 400ms debounce

    return () => {
      if (clashTimerRef.current) clearTimeout(clashTimerRef.current);
    };
  }, [date, startTime, endTime, venue, capacity, targetAudience]);

  // 6. Fetch alternative slot and venue suggestions from Module 4
  async function fetchSuggestions() {
    if (!venue || !date) return;
    setIsLoadingSuggestions(true);
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
    } finally {
      setIsLoadingSuggestions(false);
    }
  }

  // 7. handle poster file upload
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

  // 8. handle event form submission
  async function handleSubmit(e, initialStatus = 'Draft') {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    // client validation
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
        status: initialStatus,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Event created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/my-events';
        }, 1200);
      } else {
        setMessage(data.message || 'Failed to create event.');
        setIsError(true);
        setIsSubmitting(false);
      }
    } catch (err) {
      setMessage('Network error while creating event.');
      setIsError(true);
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Create New Event</h2>
        <Link
          href="/clash/report"
          style={{
            fontSize: '13px',
            padding: '5px 10px',
            background: '#e0f2fe',
            color: '#0369a1',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          🔍 View Campus Clash Report
        </Link>
      </div>

      <p>Fill out the form below to create a new event. Module 4 automatically checks for venue, capacity, organiser, audience, and blackout conflicts in real time!</p>

      <div style={{ marginBottom: '15px' }}>
        <Link href="/my-events">← Back to My Events</Link>
      </div>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {/* ========================================================================= */}
      {/* MODULE 4 REAL-TIME CLASH STATUS CARD */}
      {/* ========================================================================= */}
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

        {!clashResult && !isCheckingClash && (
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Enter <strong>Date</strong>, <strong>Start/End Time</strong>, and <strong>Venue</strong> below to run the live interval conflict check.
          </p>
        )}

        {clashResult && !clashResult.hasClash && !isCheckingClash && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>
              ✅ All Clear! No venue, capacity, organiser, audience, or blackout conflicts detected.
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#15803d' }}>
              This time slot and venue are completely free for reservation.
            </p>
          </div>
        )}

        {clashResult && clashResult.hasClash && !isCheckingClash && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '14px' }}>
              ⚠️ Conflict Alert: {clashResult.clashCount} Clash(es) Found!
            </span>
            <p style={{ margin: '4px 0 10px 0', fontSize: '13px', color: '#991b1b' }}>
              The current schedule collides with campus rules or existing bookings:
            </p>

            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
              {clashResult.clashes.map((c, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>
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
                    {c.type.toUpperCase()} ({c.severity})
                  </span>
                  <strong>{c.title}:</strong> {c.message}
                  {c.remedy && (
                    <div style={{ color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                      💡 Tip: {c.remedy}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: '12px' }}>
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
                  fontWeight: 500,
                }}
              >
                {showSuggestions ? 'Hide Alternatives' : '💡 View Alternative Slots & Venues'}
              </button>
            </div>
          </div>
        )}

        {/* ALTERNATIVE SUGGESTIONS PANEL */}
        {showSuggestions && suggestions && (
          <div
            style={{
              marginTop: '15px',
              padding: '14px',
              background: '#ffffff',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>
              🎯 Module 4 Smart Recommendations
            </h4>

            {/* 1. Alternative Slots */}
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ fontSize: '13px' }}>
                Alternative Free Slots at {venue} (Same Day):
              </strong>
              {suggestions.alternativeSlots && suggestions.alternativeSlots.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
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
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Use {slot.startTime} - {slot.endTime}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  No free continuous slots found for this venue today.
                </p>
              )}
            </div>

            {/* 2. Alternative Venues */}
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ fontSize: '13px' }}>
                Alternative Venues with Capacity &gt;= {capacity} (Free at {startTime || '10:00'} - {endTime || '12:00'}):
              </strong>
              {suggestions.alternativeVenues && suggestions.alternativeVenues.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {suggestions.alternativeVenues.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVenue(v.name)}
                      style={{
                        background: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Switch to {v.name} (Cap: {v.capacity})
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  No other campus venues with sufficient capacity are free at this exact hour.
                </p>
              )}
            </div>

            {/* 3. Alternative Dates */}
            <div>
              <strong style={{ fontSize: '13px' }}>
                Alternative Nearby Dates (Same Venue &amp; Time):
              </strong>
              {suggestions.alternativeDates && suggestions.alternativeDates.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {suggestions.alternativeDates.map((d, dIdx) => (
                    <button
                      key={dIdx}
                      type="button"
                      onClick={() => setDate(d.date)}
                      style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Move to {d.date} ({d.dayOfWeek})
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  No nearby alternative dates found.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'Draft')}>
        <div style={{ marginBottom: '10px' }}>
          <label><strong>Event Title *:</strong></label>
          <br />
          <input
            type="text"
            required
            style={{ width: '100%', maxWidth: '400px' }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Hackathon 2026"
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
            placeholder="Describe your event, rules, schedule, prizes..."
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
            <option value="Electronics &amp; Communication" />
            <option value="Mechanical Engineering" />
            <option value="Civil Engineering" />
            <option value="MBA / Management" />
          </datalist>
          <br />
          <small style={{ color: '#64748b' }}>
            Prevents scheduling two events for the same student group at the exact same hour!
          </small>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label><strong>Tags (comma separated):</strong></label>
          <br />
          <input
            type="text"
            style={{ width: '100%', maxWidth: '400px' }}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. coding, web, hackathon"
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
            placeholder="Select from college venues or enter custom"
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
          <label><strong>Capacity (Expected Attendees) *:</strong></label>
          <br />
          <input
            type="number"
            min="1"
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <br />
          <small style={{ color: '#64748b' }}>
            Module 4 verifies that expected attendees do not exceed the chosen venue capacity.
          </small>
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
            placeholder="/uploads/poster.jpg or https://..."
          />
          {posterUrl && (
            <div style={{ marginTop: '5px' }}>
              <p>Poster Preview:</p>
              <img
                src={posterUrl}
                alt="Poster preview"
                style={{ width: '150px', height: '100px', objectFit: 'cover', border: '1px solid #ccc' }}
              />
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'Draft')}
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'Pending Approval')}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </button>

          <Link href="/my-events" style={{ marginLeft: '10px', alignSelf: 'center' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
