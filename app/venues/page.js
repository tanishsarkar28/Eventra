'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VenuesDashboardPage() {
  // 1. state variables
  const [user, setUser] = useState(null);
  const [venues, setVenues] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // 2. availability checker state
  const [checkVenueId, setCheckVenueId] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [checkStartTime, setCheckStartTime] = useState('');
  const [checkEndTime, setCheckEndTime] = useState('');
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // 3. fetch all venues
  async function fetchVenues() {
    try {
      const response = await fetch('/api/venues?all=true');
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.venues || []);
        setVenues(list);
        if (list.length > 0 && !checkVenueId) {
          setCheckVenueId(list[0].id);
        }
        return list;
      }
    } catch (error) {
      // ignore
    }
    return [];
  }

  // 4. fetch pending bookings
  async function fetchPendingBookings() {
    try {
      const res = await fetch('/api/venues/bookings?status=Pending');
      if (res.ok) {
        const data = await res.json();
        setPendingBookings(data.bookings || []);
      }
    } catch (error) {
      // ignore
    }
  }

  // 5. check auth and load on mount
  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
          if (userData.user.role === 'admin') {
            await fetchPendingBookings();
          }
        }
        await fetchVenues();
      } catch (error) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // 6. toggle venue active / inactive
  async function handleToggleStatus(venueId, currentIsActive) {
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Venue ${!currentIsActive ? 'activated' : 'deactivated'} successfully.`);
        setIsError(false);
        await fetchVenues();
      } else {
        setMessage(data.message || 'Failed to update venue status.');
        setIsError(true);
      }
    } catch (error) {
      setMessage('Network error while updating venue status.');
      setIsError(true);
    }
  }

  // 7. check availability
  async function handleCheckAvailability(e) {
    e.preventDefault();
    if (!checkVenueId || !checkDate) {
      setMessage('Please select a venue and date to check availability.');
      setIsError(true);
      return;
    }

    setIsChecking(true);
    setAvailabilityResult(null);
    setMessage('');
    setIsError(false);

    try {
      let url = `/api/venues/${checkVenueId}/availability?date=${checkDate}`;
      if (checkStartTime && checkEndTime) {
        url += `&startTime=${checkStartTime}&endTime=${checkEndTime}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setAvailabilityResult(data);
      } else {
        setMessage(data.message || 'Failed to check availability.');
        setIsError(true);
      }
    } catch (error) {
      setMessage('Network error while checking availability.');
      setIsError(true);
    } finally {
      setIsChecking(false);
    }
  }

  // 8. handle approve/reject booking
  async function handleBookingAction(venueId, bookingId, action) {
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(`/api/venues/${venueId}/bookings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Booking ${action}d successfully!`);
        setIsError(false);
        await fetchPendingBookings();
      } else {
        setMessage(data.message || `Failed to ${action} booking.`);
        setIsError(true);
      }
    } catch (error) {
      setMessage(`Network error while ${action}ing booking.`);
      setIsError(true);
    }
  }

  function shortDay(day) {
    const map = {
      Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
      Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
    };
    return map[day] || day;
  }

  if (isLoading) {
    return <p>Loading venue dashboard...</p>;
  }

  const isAdmin = user && user.role === 'admin';
  const isOrganiser = user && user.role === 'organiser';
  const canBook = isAdmin || isOrganiser;
  const totalVenues = venues.length;
  const activeVenuesCount = venues.filter((v) => v.isActive !== false).length;
  const totalCapacity = venues.reduce((sum, v) => sum + (Number(v.capacity) || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2>College Venue Management</h2>
          <p style={{ margin: 0, color: '#475569' }}>
            Manage campus auditoriums, seminar halls, labs, playgrounds, bookings, and schedules.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/venues/create"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            + Add New Venue
          </Link>
        )}
      </div>

      {message && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '16px',
            borderRadius: '6px',
            background: isError ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${isError ? '#f87171' : '#86efac'}`,
            color: isError ? '#b91c1c' : '#15803d',
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TOTAL VENUES</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>{totalVenues}</div>
        </div>
        <div style={{ padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>ACTIVE VENUES</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', marginTop: '4px' }}>{activeVenuesCount}</div>
        </div>
        <div style={{ padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TOTAL CAPACITY</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>{totalCapacity.toLocaleString()}</div>
        </div>
        {isAdmin && (
          <div style={{ padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>PENDING BOOKINGS</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: pendingBookings.length > 0 ? '#d97706' : '#64748b', marginTop: '4px' }}>
              {pendingBookings.length}
            </div>
          </div>
        )}
      </div>

      {/* Venues Table */}
      <div style={{ marginBottom: '32px' }}>
        <h3>Campus Venues Directory</h3>
        {venues.length === 0 ? (
          <p>No venues registered in the database yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Facilities</th>
                  <th>Days</th>
                  <th>Timings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((venue) => {
                  const isActive = venue.isActive !== false;
                  return (
                    <tr key={venue.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                      <td>
                        <Link href={`/venues/${venue.id}`}>
                          <strong>{venue.name}</strong>
                        </Link>
                        {canBook && (
                          <div style={{ marginTop: '4px' }}>
                            {venue.requiresApproval ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#c2410c',
                                  background: '#fff7ed',
                                  border: '1px solid #fed7aa',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                                title="Organiser reservations for this venue require admin approval before confirmation"
                              >
                                🔒 Policy: Requires Approval
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#15803d',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                                title="Bookings for this venue are automatically confirmed instantly"
                              >
                                ⚡ Policy: Instant Booking
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>{venue.type}</td>
                      <td><strong>{venue.capacity}</strong></td>
                      <td>{venue.location}</td>
                      <td>
                        {Array.isArray(venue.facilities) && venue.facilities.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {venue.facilities.map((fac) => (
                              <span key={fac} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                                {fac}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <small style={{ color: '#94a3b8' }}>None</small>
                        )}
                      </td>
                      <td>
                        {Array.isArray(venue.availableDays)
                          ? venue.availableDays.map(shortDay).join(', ')
                          : 'Daily'}
                      </td>
                      <td>
                        <small>{venue.availableFrom} - {venue.availableTo}</small>
                      </td>
                      <td>
                        {isActive ? (
                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Active</span>
                        ) : (
                          <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Inactive</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '90px' }}>
                          <Link href={`/venues/${venue.id}`} style={{ fontSize: '13px' }}>
                            {canBook ? 'View & Book' : 'View Schedule'}
                          </Link>
                          {isAdmin && (
                            <>
                              <Link href={`/venues/edit/${venue.id}`} style={{ fontSize: '13px' }}>
                                Edit
                              </Link>
                              <button
                                onClick={() => handleToggleStatus(venue.id, isActive)}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  color: isActive ? '#dc2626' : '#16a34a',
                                  cursor: 'pointer',
                                }}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real-time Venue Availability & Conflict Checker */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', background: '#ffffff', marginBottom: '32px' }}>
        <h3 style={{ marginTop: 0 }}>Check Venue Availability &amp; Conflicts</h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Select a venue and date to inspect whether it is available, view booked slots, and find open time windows.
        </p>

        <form onSubmit={handleCheckAvailability}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label><strong>Select Venue *:</strong></label>
              <br />
              <select
                value={checkVenueId}
                onChange={(e) => setCheckVenueId(e.target.value)}
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Choose a Venue --</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label><strong>Select Date *:</strong></label>
              <br />
              <input
                type="date"
                required
                style={{ width: '100%' }}
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
              />
            </div>

            <div>
              <label><strong>Start Time (optional):</strong></label>
              <br />
              <input
                type="time"
                style={{ width: '100%' }}
                value={checkStartTime}
                onChange={(e) => setCheckStartTime(e.target.value)}
              />
            </div>

            <div>
              <label><strong>End Time (optional):</strong></label>
              <br />
              <input
                type="time"
                style={{ width: '100%' }}
                value={checkEndTime}
                onChange={(e) => setCheckEndTime(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={isChecking}>
            {isChecking ? 'Checking Schedule...' : 'Check Availability'}
          </button>
        </form>

        {availabilityResult && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ margin: 0 }}>
                {availabilityResult.venue?.name} on {availabilityResult.date} ({availabilityResult.dayOfWeek})
              </h4>
              <div>
                {availabilityResult.isAvailable ? (
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' }}>
                    AVAILABLE
                  </span>
                ) : (
                  <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' }}>
                    UNAVAILABLE
                  </span>
                )}
              </div>
            </div>

            {availabilityResult.reason && (
              <p style={{ color: '#dc2626', fontWeight: 600, margin: '6px 0' }}>
                {availabilityResult.reason}
              </p>
            )}

            {/* If slot was checked */}
            {checkStartTime && checkEndTime && availabilityResult.isSlotAvailable !== null && (
              <div style={{ margin: '10px 0', padding: '10px', background: availabilityResult.isSlotAvailable ? '#ecfdf5' : '#fef2f2', borderRadius: '6px' }}>
                <strong>Requested Slot ({checkStartTime} - {checkEndTime}): </strong>
                {availabilityResult.isSlotAvailable ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>FREE &amp; AVAILABLE FOR BOOKING</span>
                ) : (
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                    CONFLICT: {availabilityResult.slotConflictReason}
                  </span>
                )}
              </div>
            )}

            {/* Booked Slots */}
            {availabilityResult.bookedSlots && availabilityResult.bookedSlots.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <strong>Booked / Reserved Slots on this Date:</strong>
                <table border="1" cellPadding="6" style={{ width: '100%', marginTop: '6px', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th>Timing</th>
                      <th>Title / Reason</th>
                      <th>Type</th>
                      <th>Booked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availabilityResult.bookedSlots.map((slot, idx) => (
                      <tr key={idx}>
                        <td><strong>{slot.startTime} - {slot.endTime}</strong></td>
                        <td>{slot.title}</td>
                        <td>{slot.type}</td>
                        <td>{slot.requestedByName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Open Slots */}
            {availabilityResult.availableSlots && availabilityResult.availableSlots.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <strong>Open Time Windows for New Events:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {availabilityResult.availableSlots.map((slot, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {slot.startTime} - {slot.endTime}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Pending Bookings Approval Section */}
      {isAdmin && (
        <div style={{ border: '1px solid #fed7aa', borderRadius: '12px', padding: '24px', background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderTop: '4px solid #ea580c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <span>🛡️</span> Pending Venue Booking Requests
              {pendingBookings.length > 0 && (
                <span style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  {pendingBookings.length} Awaiting Decision
                </span>
              )}
            </h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: '16px' }}>
            When organisers request reservations for venues with a <em>&quot;Requires Approval&quot;</em> policy, their booking requests appear here for your administrative review (<strong>Approve</strong> or <strong>Reject</strong>).
          </p>

          {pendingBookings.length === 0 ? (
            <div style={{ padding: '28px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontWeight: 600, color: '#334155', fontSize: '15px' }}>No booking requests currently awaiting approval</div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '6px 0 0 0' }}>
                All organizer requests have been processed. New booking submissions for approval-required halls will display here with instant Approve/Reject controls.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#fff7ed', color: '#9a3412', borderBottom: '2px solid #fed7aa' }}>
                    <th style={{ textAlign: 'left' }}>Venue</th>
                    <th style={{ textAlign: 'left' }}>Event / Activity</th>
                    <th style={{ textAlign: 'left' }}>Date</th>
                    <th style={{ textAlign: 'left' }}>Time</th>
                    <th style={{ textAlign: 'left' }}>Requested By</th>
                    <th style={{ textAlign: 'center' }}>Decisions &amp; Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBookings.map((b) => (
                    <tr key={b.id} style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                      <td>
                        <strong>{b.venueName}</strong>
                        {b.note && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{b.note}</div>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{b.title}</span>
                      </td>
                      <td>{b.date}</td>
                      <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{b.startTime} - {b.endTime}</code></td>
                      <td>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
                          {b.requestedByName || b.requestedBy}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleBookingAction(b.venueId, b.id, 'approve')}
                            style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '13px',
                              boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleBookingAction(b.venueId, b.id, 'reject')}
                            style={{
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '13px',
                              boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)',
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
