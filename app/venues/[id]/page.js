'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VenueDetailPage({ params }) {
  const { id } = params;

  // 1. main state
  const [user, setUser] = useState(null);
  const [venue, setVenue] = useState(null);
  const [blackouts, setBlackouts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // 2. blackout form state
  const [blackoutDate, setBlackoutDate] = useState('');
  const [blackoutReason, setBlackoutReason] = useState('Exams');
  const [blackoutNote, setBlackoutNote] = useState('');
  const [isSubmittingBlackout, setIsSubmittingBlackout] = useState(false);

  // 3. new booking request form state
  const [bookDate, setBookDate] = useState('');
  const [bookStart, setBookStart] = useState('10:00');
  const [bookEnd, setBookEnd] = useState('12:00');
  const [bookTitle, setBookTitle] = useState('');
  const [bookNote, setBookNote] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // 4. availability check state
  const [checkDate, setCheckDate] = useState('');
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // 5. load data
  async function loadAllData() {
    try {
      // fetch user
      const userRes = await fetch('/api/users/me');
      if (userRes.ok) {
        const uData = await userRes.json();
        setUser(uData.user);
      }

      // fetch venue
      const vRes = await fetch(`/api/venues/${id}`);
      if (!vRes.ok) {
        setIsError(true);
        setMessage('Venue not found.');
        return;
      }
      const vData = await vRes.json();
      setVenue(vData.venue);

      // fetch blackouts
      const bRes = await fetch(`/api/venues/${id}/blackouts`);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBlackouts(bData.blackouts || []);
      }

      // fetch bookings
      const bkRes = await fetch(`/api/venues/${id}/bookings`);
      if (bkRes.ok) {
        const bkData = await bkRes.json();
        setBookings(bkData.bookings || []);
      }
    } catch (err) {
      setIsError(true);
      setMessage('Failed to load venue details.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, [id]);

  // 6. handle adding blackout (admin only)
  async function handleAddBlackout(e) {
    e.preventDefault();
    if (!blackoutDate) {
      setMessage('Please select a date to block.');
      setIsError(true);
      return;
    }

    setIsSubmittingBlackout(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch(`/api/venues/${id}/blackouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: blackoutDate,
          reason: blackoutReason,
          note: blackoutNote,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Venue blocked on ${blackoutDate} (${blackoutReason}).`);
        setIsError(false);
        setBlackoutDate('');
        setBlackoutNote('');
        loadAllData();
      } else {
        setMessage(data.message || 'Failed to block venue.');
        setIsError(true);
      }
    } catch (err) {
      setMessage('Network error while blocking venue.');
      setIsError(true);
    } finally {
      setIsSubmittingBlackout(false);
    }
  }

  // 7. handle removing blackout (admin only)
  async function handleRemoveBlackout(blackoutId) {
    if (!confirm('Are you sure you want to unblock this date?')) return;

    setMessage('');
    setIsError(false);

    try {
      const res = await fetch(`/api/venues/${id}/blackouts?blackoutId=${blackoutId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Blackout removed successfully.');
        setIsError(false);
        loadAllData();
      } else {
        setMessage(data.message || 'Failed to remove blackout.');
        setIsError(true);
      }
    } catch (err) {
      setMessage('Network error while removing blackout.');
      setIsError(true);
    }
  }

  // 8. handle new booking request
  async function handleCreateBooking(e) {
    e.preventDefault();
    if (!bookDate || !bookStart || !bookEnd || !bookTitle) {
      setMessage('Please fill in all booking fields.');
      setIsError(true);
      return;
    }

    setIsSubmittingBooking(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch(`/api/venues/${id}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: bookDate,
          startTime: bookStart,
          endTime: bookEnd,
          title: bookTitle,
          note: bookNote,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Booking request submitted successfully.');
        setIsError(false);
        setBookTitle('');
        setBookNote('');
        loadAllData();
      } else {
        setMessage(data.message || 'Failed to submit booking.');
        setIsError(true);
      }
    } catch (err) {
      setMessage('Network error while submitting booking.');
      setIsError(true);
    } finally {
      setIsSubmittingBooking(false);
    }
  }

  // 9. handle approve/reject booking (admin only)
  async function handleBookingAction(bookingId, action) {
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch(`/api/venues/${id}/bookings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Booking ${action}d successfully.`);
        setIsError(false);
        loadAllData();
      } else {
        setMessage(data.message || `Failed to ${action} booking.`);
        setIsError(true);
      }
    } catch (err) {
      setMessage(`Network error while ${action}ing booking.`);
      setIsError(true);
    }
  }

  // 10. check availability on selected date
  async function handleCheckAvailability(e) {
    e.preventDefault();
    if (!checkDate) return;

    setIsChecking(true);
    setAvailabilityResult(null);

    try {
      const res = await fetch(`/api/venues/${id}/availability?date=${checkDate}`);
      if (res.ok) {
        const data = await res.json();
        setAvailabilityResult(data);
      }
    } catch (err) {
      // ignore
    } finally {
      setIsChecking(false);
    }
  }

  if (isLoading) {
    return <p>Loading venue details...</p>;
  }

  if (!venue) {
    return (
      <div>
        <h2>Venue Not Found</h2>
        <Link href="/venues">← Back to Venues</Link>
      </div>
    );
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>{venue.name}</h2>
        {isAdmin && (
          <Link href={`/venues/edit/${venue.id}`} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', textDecoration: 'none' }}>
            Edit Venue
          </Link>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <Link href="/venues">← Back to Venues</Link>
      </div>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold' }}>
          {message}
        </p>
      )}

      {/* Venue Information Card */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <strong>Type:</strong> {venue.type}
          </div>
          <div>
            <strong>Capacity:</strong> {venue.capacity} attendees
          </div>
          <div>
            <strong>Location:</strong> {venue.location}
          </div>
          <div>
            <strong>Operating Hours:</strong> {venue.availableFrom} - {venue.availableTo}
          </div>
          <div>
            <strong>Status:</strong>{' '}
            <span style={{ color: venue.isActive !== false ? 'green' : 'red', fontWeight: 'bold' }}>
              {venue.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <strong>Approval:</strong> {venue.requiresApproval ? 'Admin Approval Required' : 'Instant Confirmation'}
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <strong>Facilities:</strong>{' '}
          {venue.facilities && venue.facilities.length > 0 ? (
            venue.facilities.map((f) => (
              <span key={f} style={{ display: 'inline-block', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginRight: '6px' }}>
                {f}
              </span>
            ))
          ) : (
            <span style={{ color: '#64748b' }}>None listed</span>
          )}
        </div>

        <div style={{ marginTop: '8px' }}>
          <strong>Available Days:</strong>{' '}
          {venue.availableDays && venue.availableDays.length > 0
            ? venue.availableDays.join(', ')
            : 'Everyday'}
        </div>
      </div>

      {/* Quick Availability Checker */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <h3>Check Date Availability</h3>
        <form onSubmit={handleCheckAvailability} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label><strong>Date:</strong></label>
            <br />
            <input
              type="date"
              required
              value={checkDate}
              onChange={(e) => setCheckDate(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Check Availability'}
          </button>
        </form>

        {availabilityResult && (
          <div style={{ marginTop: '15px', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Status for {availabilityResult.date} ({availabilityResult.dayOfWeek}): </strong>
              <span style={{ color: availabilityResult.isAvailable ? 'green' : 'red', fontWeight: 'bold' }}>
                {availabilityResult.isAvailable ? 'Available' : 'Unavailable'}
              </span>
              {availabilityResult.reason && (
                <span style={{ display: 'block', color: 'red', marginTop: '4px' }}>
                  {availabilityResult.reason}
                </span>
              )}
            </p>

            {availabilityResult.bookedSlots && availabilityResult.bookedSlots.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>Booked / Occupied Slots:</strong>
                <ul>
                  {availabilityResult.bookedSlots.map((s, idx) => (
                    <li key={idx}>
                      {s.startTime} - {s.endTime}: <em>{s.title}</em> ({s.type})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {availabilityResult.availableSlots && availabilityResult.availableSlots.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>Open / Free Time Slots:</strong>
                <ul>
                  {availabilityResult.availableSlots.map((s, idx) => (
                    <li key={idx} style={{ color: 'green' }}>
                      {s.startTime} - {s.endTime}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blackouts Management (Admin Only) */}
      {isAdmin && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <h3>Block Venue (Blackout Dates)</h3>
          <p><small>Block this venue for exams, maintenance, college holidays, or inspections.</small></p>

          <form onSubmit={handleAddBlackout} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <label><strong>Date to Block *:</strong></label>
              <br />
              <input
                type="date"
                required
                value={blackoutDate}
                onChange={(e) => setBlackoutDate(e.target.value)}
              />
            </div>

            <div>
              <label><strong>Reason *:</strong></label>
              <br />
              <select
                value={blackoutReason}
                onChange={(e) => setBlackoutReason(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="Exams">Exams</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Holiday">Holiday</option>
                <option value="Official Function">Official Function</option>
                <option value="Renovation">Renovation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label><strong>Note:</strong></label>
              <br />
              <input
                type="text"
                placeholder="Optional details"
                value={blackoutNote}
                onChange={(e) => setBlackoutNote(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isSubmittingBlackout}>
              {isSubmittingBlackout ? 'Blocking...' : 'Block Date'}
            </button>
          </form>

          {blackouts.length === 0 ? (
            <p><small>No dates are currently blocked for this venue.</small></p>
          ) : (
            <table border="1" cellPadding="6" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Note</th>
                  <th>Blocked By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {blackouts.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.date}</strong></td>
                    <td>{b.reason || b.title}</td>
                    <td>{b.note || '-'}</td>
                    <td>{b.requestedByName || 'Admin'}</td>
                    <td>
                      <button onClick={() => handleRemoveBlackout(b.id)} style={{ color: 'red' }}>
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Book Venue Section */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <h3>Request Venue Booking</h3>
        <p><small>Book this venue for an upcoming club activity, workshop, or rehearsal.</small></p>

        <form onSubmit={handleCreateBooking} style={{ maxWidth: '500px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label><strong>Event / Booking Title *:</strong></label>
            <br />
            <input
              type="text"
              required
              style={{ width: '100%' }}
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="e.g. Robotics Club Practice Session"
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Booking Date *:</strong></label>
            <br />
            <input
              type="date"
              required
              value={bookDate}
              onChange={(e) => setBookDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            <div>
              <label><strong>Start Time *:</strong></label>
              <br />
              <input
                type="time"
                required
                value={bookStart}
                onChange={(e) => setBookStart(e.target.value)}
              />
            </div>
            <div>
              <label><strong>End Time *:</strong></label>
              <br />
              <input
                type="time"
                required
                value={bookEnd}
                onChange={(e) => setBookEnd(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label><strong>Note / Purpose:</strong></label>
            <br />
            <textarea
              rows="2"
              style={{ width: '100%' }}
              value={bookNote}
              onChange={(e) => setBookNote(e.target.value)}
              placeholder="Any special requirements..."
            />
          </div>

          <button type="submit" disabled={isSubmittingBooking}>
            {isSubmittingBooking ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </form>
      </div>

      {/* Bookings List Section */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
        <h3>Venue Bookings &amp; Schedule</h3>

        {bookings.length === 0 ? (
          <p><small>No bookings found for this venue.</small></p>
        ) : (
          <table border="1" cellPadding="6" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Requested By</th>
                <th>Status</th>
                {isAdmin && <th>Admin Action</th>}
              </tr>
            </thead>
            <tbody>
              {bookings.map((bk) => (
                <tr key={bk.id}>
                  <td><strong>{bk.title}</strong></td>
                  <td>{bk.date}</td>
                  <td>{bk.startTime} - {bk.endTime}</td>
                  <td>{bk.requestedByName || bk.requestedBy}</td>
                  <td>
                    <strong>
                      {bk.status === 'Approved' && <span style={{ color: 'green' }}>Approved</span>}
                      {bk.status === 'Confirmed' && <span style={{ color: 'green' }}>Confirmed</span>}
                      {bk.status === 'Pending' && <span style={{ color: 'orange' }}>Pending Approval</span>}
                      {bk.status === 'Rejected' && <span style={{ color: 'red' }}>Rejected</span>}
                      {bk.status === 'Cancelled' && <span style={{ color: 'gray' }}>Cancelled</span>}
                    </strong>
                  </td>
                  {isAdmin && (
                    <td>
                      {bk.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleBookingAction(bk.id, 'approve')}
                            style={{ color: 'green' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleBookingAction(bk.id, 'reject')}
                            style={{ color: 'red' }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <em>Completed</em>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
