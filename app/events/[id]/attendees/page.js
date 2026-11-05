'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AttendeesManagementPage({ params }) {
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [ticketInput, setTicketInput] = useState('');
  const [scanMessage, setScanMessage] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch attendees and metrics
  async function loadAttendees() {
    try {
      const [userRes, attRes] = await Promise.all([
        fetch('/api/users/me'),
        fetch(`/api/events/${id}/attendees`),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }

      if (attRes.ok) {
        const json = await attRes.json();
        setData(json);
      } else {
        const errJson = await attRes.json();
        setScanError(errJson.error || 'Failed to load attendees.');
      }
    } catch (e) {
      setScanError('Network error loading attendees.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendees();
  }, [id]);

  // Handle ticket check-in (QR Scan / Manual entry)
  async function handleCheckIn(codeToUse) {
    const code = codeToUse || ticketInput;
    if (!code || !code.trim()) {
      alert('Please enter or scan a ticket code.');
      return;
    }

    setIsScanning(true);
    setScanMessage(null);
    setScanError(null);

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: code.trim(),
          eventId: id,
        }),
      });

      const resJson = await res.json();

      if (res.ok) {
        setScanMessage(resJson.message);
        setTicketInput('');
        await loadAttendees();
      } else {
        setScanError(resJson.error || 'Check-in failed.');
      }
    } catch (e) {
      setScanError('Network error during check-in.');
    } finally {
      setIsScanning(false);
    }
  }

  if (loading) {
    return <p style={{ padding: '20px' }}>Loading attendee and check-in records...</p>;
  }

  if (!data || !data.event) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Access Denied or Event Not Found</h2>
        <p>{scanError || 'You do not have permission to view attendees for this event.'}</p>
        <Link href="/my-events">Back to My Events</Link>
      </div>
    );
  }

  const { event, summary, attendees = [], waitlist = [] } = data;

  const filteredAttendees = attendees.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.userName?.toLowerCase().includes(term) ||
      a.userEmail?.toLowerCase().includes(term) ||
      a.ticketCode?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '15px' }}>
      <p>
        <Link href={`/events/${id}`}>← Back to Event Page</Link> |{' '}
        <Link href="/my-events">My Events Dashboard</Link>
      </p>

      <h2>📋 Attendance & Check-In Console</h2>
      <p style={{ margin: '4px 0 20px 0', color: '#555' }}>
        <strong>{event.title}</strong> — 📅 {event.date} ({event.startTime} - {event.endTime}) @ 📍 {event.venue}
      </p>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '25px',
        }}
      >
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '14px', background: '#f9f9f9', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Capacity</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.totalCapacity}</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '14px', background: '#f9f9f9', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Registered</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>{summary.totalRegistered}</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '14px', background: '#f9f9f9', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Checked In</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{summary.totalCheckedIn}</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '14px', background: '#f9f9f9', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Attendance Rate</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>{summary.attendanceRate}%</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '14px', background: '#f9f9f9', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Waitlist</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{summary.totalWaitlist}</div>
        </div>
      </div>

      {/* QR Ticket Scanner / Code Check-in Box */}
      <div
        style={{
          border: '2px solid #28a745',
          borderRadius: '8px',
          padding: '20px',
          background: '#f6fff8',
          marginBottom: '25px',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#1e7e34' }}>📱 QR Ticket Scanner & Check-In</h3>
        <p style={{ fontSize: '14px', color: '#444' }}>
          Scan the student's QR code pass with a handheld barcode scanner, or type/paste their Ticket Code below:
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCheckIn();
          }}
          style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input
            type="text"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            placeholder="e.g. EVT-1004-6058-AB3F"
            style={{
              padding: '10px 14px',
              fontSize: '16px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              minWidth: '260px',
              letterSpacing: '1px',
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={isScanning}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {isScanning ? 'Verifying...' : '✓ Verify & Check In'}
          </button>
        </form>

        {scanMessage && (
          <div
            style={{
              marginTop: '15px',
              padding: '10px',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            ✅ {scanMessage}
          </div>
        )}

        {scanError && (
          <div
            style={{
              marginTop: '15px',
              padding: '10px',
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            ❌ {scanError}
          </div>
        )}
      </div>

      {/* CSV Export & Attendee Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '15px',
        }}
      >
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search attendee by name, email, or code..."
            style={{ padding: '8px 12px', minWidth: '300px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <a
            href={`/api/events/${id}/attendees?format=csv`}
            download
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#0070f3',
              color: '#fff',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            ⬇️ Export Attendance (CSV)
          </a>
        </div>
      </div>

      {/* Confirmed Attendees Table */}
      <h3>Confirmed Attendees ({attendees.length})</h3>
      {attendees.length === 0 ? (
        <p>No confirmed registrations yet.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th>Student Name</th>
              <th>Email</th>
              <th>Ticket Code</th>
              <th>Team Size</th>
              <th>Registered At</th>
              <th>Attendance Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendees.map((att) => (
              <tr key={att.registrationId}>
                <td><strong>{att.userName}</strong></td>
                <td>{att.userEmail}</td>
                <td>
                  <code style={{ background: '#eee', padding: '2px 6px', borderRadius: '3px' }}>
                    {att.ticketCode}
                  </code>
                </td>
                <td style={{ textAlign: 'center' }}>{att.teamSize}</td>
                <td>{new Date(att.registeredAt).toLocaleDateString()}</td>
                <td style={{ textAlign: 'center' }}>
                  {att.isCheckedIn ? (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                      🟢 Checked In ({new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  ) : (
                    <span style={{ color: '#888' }}>⚪ Not Checked In</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {!att.isCheckedIn ? (
                    <button
                      onClick={() => handleCheckIn(att.ticketCode)}
                      style={{
                        padding: '4px 10px',
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Quick Check-In
                    </button>
                  ) : (
                    <span style={{ color: '#28a745', fontSize: '13px' }}>✓ Done</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Waitlist Table */}
      {waitlist.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: '#d39e00' }}>⏳ Waitlist Queue ({waitlist.length})</h3>
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fff9e6' }}>
                <th>Queue Position</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Team Size</th>
                <th>Joined Waitlist</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((wait) => (
                <tr key={wait.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>#{wait.position}</td>
                  <td>{wait.userName}</td>
                  <td>{wait.userEmail}</td>
                  <td style={{ textAlign: 'center' }}>{wait.teamSize}</td>
                  <td>{new Date(wait.createdAt).toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ color: '#856404', fontWeight: 'bold' }}>Waiting</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
