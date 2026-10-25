'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CreateEventPage() {
  // 1. form fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
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
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 3. fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
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
        // use fallback categories
        setCategories(['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar']);
        setCategory('Technical');
      }
    }
    loadCategories();
  }, []);

  // 4. handle poster file upload
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

  // 5. handle event form submission
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
      <h2>Create New Event</h2>
      <p>Fill out the form below to create a new event for your club.</p>

      <div style={{ marginBottom: '15px' }}>
        <Link href="/my-events">← Back to My Events</Link>
      </div>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

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
            style={{ width: '100%', maxWidth: '400px' }}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Main Auditorium, Lab 3"
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label><strong>Capacity (Number of attendees) *:</strong></label>
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
