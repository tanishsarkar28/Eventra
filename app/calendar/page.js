'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [schedule, setSchedule] = useState({ timetable: [], registeredEvents: [], bookmarkedEvents: [] });
  const [weeklyAgenda, setWeeklyAgenda] = useState({});
  const [allEvents, setAllEvents] = useState([]);

  // Active Tab: 'weekly' | 'timetable' | 'clash' | 'free'
  const [activeTab, setActiveTab] = useState('weekly');

  // New Timetable Slot Form State
  const [newSlot, setNewSlot] = useState({
    subject: '',
    dayOfWeek: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    room: 'Lab 1',
    instructor: '',
  });
  const [slotMessage, setSlotMessage] = useState('');

  // Clash Checker State
  const [clashEventId, setClashEventId] = useState('');
  const [customClash, setCustomClash] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:30',
    title: 'Hackathon Workshop',
  });
  const [clashResult, setClashResult] = useState(null);
  const [checkingClash, setCheckingClash] = useState(false);

  // Free Slots State
  const [freeSlotDate, setFreeSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [freeSlots, setFreeSlots] = useState([]);
  const [loadingFreeSlots, setLoadingFreeSlots] = useState(false);

  // 1. Fetch Calendar Data on Load
  useEffect(() => {
    fetchCalendarData();
    fetchPublishedEvents();
  }, []);

  async function fetchCalendarData(dateFilter = '') {
    setLoading(true);
    setError('');
    try {
      const url = dateFilter ? `/api/calendar?date=${dateFilter}` : '/api/calendar';
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setError('Please log in to access your personal calendar.');
        } else {
          setError(data.error || 'Failed to load calendar.');
        }
        setLoading(false);
        return;
      }

      setUser(data.user);
      setSchedule(data.schedule || { timetable: [], registeredEvents: [], bookmarkedEvents: [] });
      setWeeklyAgenda(data.weeklyAgenda || {});
      if (data.freeSlots) {
        setFreeSlots(data.freeSlots);
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPublishedEvents() {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.events) {
        setAllEvents(data.events.filter((e) => e.status === 'Published'));
      }
    } catch (e) {
      // Ignore
    }
  }

  // 2. Add New Timetable Slot
  async function handleAddSlot(e) {
    e.preventDefault();
    setSlotMessage('');
    try {
      const res = await fetch('/api/calendar/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlot),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSlotMessage(`❌ Error: ${data.error || 'Failed to add slot'}`);
        return;
      }

      setSlotMessage(`✅ Added ${newSlot.subject} (${newSlot.dayOfWeek}) successfully!`);
      // Reset subject and refresh
      setNewSlot({ ...newSlot, subject: '' });
      fetchCalendarData();
    } catch (err) {
      setSlotMessage('❌ Network error adding slot.');
    }
  }

  // 3. Load Sample College Timetable (One-Click Convenience)
  async function handleLoadSampleTimetable() {
    setSlotMessage('Loading sample college timetable...');
    const samples = [
      { subject: 'DBMS Lecture', dayOfWeek: 'Thursday', startTime: '10:00', endTime: '11:00', room: 'Lab 3', instructor: 'Prof. Sharma' },
      { subject: 'Operating Systems', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Room 201', instructor: 'Dr. Rao' },
      { subject: 'Data Structures Lab', dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '16:00', room: 'Computer Lab 2', instructor: 'Prof. Mehta' },
      { subject: 'Computer Networks', dayOfWeek: 'Wednesday', startTime: '11:00', endTime: '12:30', room: 'Room 105', instructor: 'Dr. Verma' },
      { subject: 'Artificial Intelligence', dayOfWeek: 'Friday', startTime: '10:00', endTime: '11:30', room: 'Seminar Hall', instructor: 'Prof. Sen' },
    ];

    try {
      const res = await fetch('/api/calendar/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: samples }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSlotMessage(`✅ Sample timetable added (${samples.length} lectures)!`);
        fetchCalendarData();
      } else {
        setSlotMessage(`❌ Error: ${data.error || 'Failed to load samples'}`);
      }
    } catch (err) {
      setSlotMessage('❌ Error loading samples.');
    }
  }

  // 4. Delete a Timetable Slot
  async function handleDeleteSlot(slotId) {
    if (!confirm('Are you sure you want to delete this class slot?')) return;
    try {
      const res = await fetch(`/api/calendar/timetable?id=${slotId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCalendarData();
      } else {
        alert(data.error || 'Failed to delete slot');
      }
    } catch (err) {
      alert('Error deleting slot');
    }
  }

  // 5. File Upload Timetable (.json or .csv)
  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        let slots = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          slots = Array.isArray(parsed) ? parsed : parsed.slots || [];
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV Parser: subject,dayOfWeek,startTime,endTime,room,instructor
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim());
            if (cols.length >= 4) {
              slots.push({
                subject: cols[0],
                dayOfWeek: cols[1],
                startTime: cols[2],
                endTime: cols[3],
                room: cols[4] || 'Classroom',
                instructor: cols[5] || '',
              });
            }
          }
        }

        if (slots.length === 0) {
          alert('No slots found in file. Supported format: .json or .csv');
          return;
        }

        const res = await fetch('/api/calendar/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slots }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(`✅ Imported ${data.addedSlots?.length || slots.length} slots from file!`);
          fetchCalendarData();
        } else {
          alert(`❌ Import error: ${data.error}`);
        }
      } catch (err) {
        alert('Failed to parse file. Please upload a valid JSON or CSV.');
      }
    };
    reader.readAsText(file);
  }

  // 6. Test Clash Detector
  async function handleCheckClash(e) {
    e.preventDefault();
    setCheckingClash(true);
    setClashResult(null);

    try {
      let queryUrl = '';
      if (clashEventId) {
        queryUrl = `/api/calendar/clashes?eventId=${clashEventId}`;
      } else {
        queryUrl = `/api/calendar/clashes?date=${customClash.date}&startTime=${customClash.startTime}&endTime=${customClash.endTime}&title=${encodeURIComponent(customClash.title)}`;
      }

      const res = await fetch(queryUrl);
      const data = await res.json();
      setClashResult(data);
    } catch (err) {
      setClashResult({ hasClash: false, message: 'Failed to check clash.' });
    } finally {
      setCheckingClash(false);
    }
  }

  // 7. Calculate Free Slots for selected date
  async function handleFindFreeSlots(e) {
    e.preventDefault();
    setLoadingFreeSlots(true);
    try {
      const res = await fetch(`/api/calendar?date=${freeSlotDate}`);
      const data = await res.json();
      if (data.freeSlots) {
        setFreeSlots(data.freeSlots);
      }
    } catch (err) {
      // Ignore
    } finally {
      setLoadingFreeSlots(false);
    }
  }

  // Download .ics helper
  function handleDownloadIcs() {
    window.location.href = '/api/calendar/export.ics';
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>⏳ Loading your calendar & schedule...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fef2f2' }}>
        <h3 style={{ color: '#991b1b', marginTop: 0 }}>Access Notice</h3>
        <p>{error}</p>
        <Link href="/login" style={{ display: 'inline-block', padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>
          Go to Login
        </Link>
      </div>
    );
  }

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div>
      {/* Header bar with title and ICS Export button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>📅 Personal Calendar & Schedule</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Welcome, <strong>{user?.name}</strong>! Keep track of your lectures, registered events, and free slots.
          </p>
        </div>
        <button
          onClick={handleDownloadIcs}
          style={{
            padding: '10px 16px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          📥 Export .ics (Sync with Google / Apple Calendar)
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('weekly')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'weekly' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'weekly' ? '#ffffff' : '#334155',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          📆 Weekly Schedule
        </button>
        <button
          onClick={() => setActiveTab('timetable')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'timetable' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'timetable' ? '#ffffff' : '#334155',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          📚 Manage Timetable ({schedule.timetable.length})
        </button>
        <button
          onClick={() => setActiveTab('clash')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'clash' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'clash' ? '#ffffff' : '#334155',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ⚠️ Personal Clash Checker
        </button>
        <button
          onClick={() => setActiveTab('free')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'free' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'free' ? '#ffffff' : '#334155',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ⏰ Free-Slot View
        </button>
      </div>

      {/* TAB 1: WEEKLY SCHEDULE */}
      {activeTab === 'weekly' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e0f2fe', border: '1px solid #0284c7', borderRadius: '3px' }}></span>
              Class Lectures
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#dcfce7', border: '1px solid #16a34a', borderRadius: '3px' }}></span>
              Registered Events ({schedule.registeredEvents.length})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fef3c7', border: '1px solid #d97706', borderRadius: '3px' }}></span>
              Bookmarked Events ({schedule.bookmarkedEvents.length})
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {daysList.map((day) => {
              const items = weeklyAgenda[day] || [];
              return (
                <div key={day} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '8px', color: '#1e293b' }}>
                    {day}
                  </div>
                  {items.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                      No classes or events scheduled.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: item.type === 'class' ? '1px solid #bae6fd' : '1px solid #bbf7d0',
                            background: item.type === 'class' ? '#f0f9ff' : '#f0fdf4',
                            fontSize: '13px',
                          }}
                        >
                          <div style={{ fontWeight: '600', color: item.type === 'class' ? '#0369a1' : '#15803d' }}>
                            {item.type === 'class' ? '📚 ' : '🎟️ '} {item.title}
                          </div>
                          <div style={{ color: '#475569', marginTop: '2px' }}>
                            ⏰ {item.startTime} - {item.endTime}
                          </div>
                          {item.room && <div style={{ color: '#64748b' }}>📍 Room: {item.room}</div>}
                          {item.venue && <div style={{ color: '#64748b' }}>📍 Venue: {item.venue}</div>}
                          {item.instructor && <div style={{ color: '#64748b' }}>👤 {item.instructor}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bookmarked Events Section */}
          {schedule.bookmarkedEvents.length > 0 && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#92400e', fontSize: '16px' }}>
                ⭐ Bookmarked Events for Later
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {schedule.bookmarkedEvents.map((b) => (
                  <div key={b.id} style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fcd34d', fontSize: '13px' }}>
                    <strong>{b.title}</strong>
                    <div style={{ color: '#78350f' }}>📅 {b.date} | ⏰ {b.startTime} - {b.endTime}</div>
                    <Link href={`/events/${b.id}`} style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '12px' }}>
                      View Details & Register
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE TIMETABLE */}
      {activeTab === 'timetable' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Add Class Timetable Slots</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleLoadSampleTimetable}
                style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
              >
                ⚡ Load Sample College Timetable
              </button>
              <label style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                📁 Import File (.json / .csv)
                <input type="file" accept=".json,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAddSlot} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Subject Name *</label>
                <input
                  type="text"
                  placeholder="e.g. DBMS Lecture"
                  value={newSlot.subject}
                  onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Day of Week *</label>
                <select
                  value={newSlot.dayOfWeek}
                  onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  {daysList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Start Time *</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>End Time *</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Room / Lab</label>
                <input
                  type="text"
                  placeholder="e.g. Lab 3"
                  value={newSlot.room}
                  onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Instructor (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Sharma"
                  value={newSlot.instructor}
                  onChange={(e) => setNewSlot({ ...newSlot, instructor: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="submit"
                style={{ padding: '8px 18px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
              >
                ➕ Add Slot to Timetable
              </button>
              {slotMessage && <span style={{ fontSize: '13px', fontWeight: '500' }}>{slotMessage}</span>}
            </div>
          </form>

          {/* List of current timetable slots */}
          <h4 style={{ margin: '0 0 10px 0' }}>Your Timetable Slots ({schedule.timetable.length})</h4>
          {schedule.timetable.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>No timetable slots added yet. Add one above or click &quot;Load Sample College Timetable&quot;!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 12px' }}>Day</th>
                    <th style={{ padding: '8px 12px' }}>Subject</th>
                    <th style={{ padding: '8px 12px' }}>Time</th>
                    <th style={{ padding: '8px 12px' }}>Room</th>
                    <th style={{ padding: '8px 12px' }}>Instructor</th>
                    <th style={{ padding: '8px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.timetable.map((slot) => (
                    <tr key={slot.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: '600' }}>{slot.dayOfWeek}</td>
                      <td style={{ padding: '8px 12px' }}>{slot.subject}</td>
                      <td style={{ padding: '8px 12px' }}>{slot.startTime} - {slot.endTime}</td>
                      <td style={{ padding: '8px 12px' }}>{slot.room || '-'}</td>
                      <td style={{ padding: '8px 12px' }}>{slot.instructor || '-'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERSONAL CLASH CHECKER */}
      {activeTab === 'clash' && (
        <div>
          <h3>⚠️ Personal Schedule Clash Warning</h3>
          <p style={{ color: '#475569', fontSize: '14px' }}>
            Check if an upcoming event overlaps with your class timetable (e.g. DBMS lecture) or another event you are already registered for.
          </p>

          <form onSubmit={handleCheckClash} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                Option 1: Pick an Existing Campus Event
              </label>
              <select
                value={clashEventId}
                onChange={(e) => setClashEventId(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Or enter custom date and times below --</option>
                {allEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date} from {ev.startTime} to {ev.endTime})
                  </option>
                ))}
              </select>
            </div>

            {!clashEventId && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    value={customClash.date}
                    onChange={(e) => setCustomClash({ ...customClash, date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Start Time</label>
                  <input
                    type="time"
                    value={customClash.startTime}
                    onChange={(e) => setCustomClash({ ...customClash, startTime: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>End Time</label>
                  <input
                    type="time"
                    value={customClash.endTime}
                    onChange={(e) => setCustomClash({ ...customClash, endTime: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button
                type="submit"
                disabled={checkingClash}
                style={{ padding: '8px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
              >
                {checkingClash ? 'Checking...' : '🔍 Check Personal Clash'}
              </button>
            </div>
          </form>

          {/* Clash Result Banner */}
          {clashResult && (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: clashResult.hasClash ? '1px solid #fca5a5' : '1px solid #86efac',
                background: clashResult.hasClash ? '#fef2f2' : '#f0fdf4',
              }}
            >
              <h4 style={{ margin: '0 0 6px 0', color: clashResult.hasClash ? '#991b1b' : '#166534' }}>
                {clashResult.hasClash ? '⚠️ Clash Warning Detected!' : '✅ Schedule is Clear!'}
              </h4>
              <p style={{ margin: 0, color: clashResult.hasClash ? '#7f1d1d' : '#14532d', fontSize: '14px', fontWeight: '500' }}>
                {clashResult.message}
              </p>
              {clashResult.conflictingItem && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#334155', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <strong>Conflict Details:</strong> {clashResult.conflictingItem.subject || clashResult.conflictingItem.title} (
                  {clashResult.conflictingItem.startTime} - {clashResult.conflictingItem.endTime}
                  {clashResult.conflictingItem.room ? `, Room: ${clashResult.conflictingItem.room}` : ''})
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FREE SLOTS VIEW */}
      {activeTab === 'free' && (
        <div>
          <h3>⏰ Free-Slot View</h3>
          <p style={{ color: '#475569', fontSize: '14px' }}>
            Find the exact hours in your day when you have no classes and no registered events.
          </p>

          <form onSubmit={handleFindFreeSlots} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px', fontWeight: '600' }}>Select Date:</label>
            <input
              type="date"
              value={freeSlotDate}
              onChange={(e) => setFreeSlotDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <button
              type="submit"
              disabled={loadingFreeSlots}
              style={{ padding: '8px 16px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              {loadingFreeSlots ? 'Calculating...' : 'Find Free Slots'}
            </button>
          </form>

          {freeSlots.length === 0 ? (
            <p style={{ color: '#64748b' }}>No free slots found or full day is occupied between 08:00 and 18:00.</p>
          ) : (
            <div>
              <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '15px' }}>
                Available Free Time on {freeSlotDate}:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {freeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                    }}
                  >
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#15803d' }}>
                      ⏰ {slot.startTime} - {slot.endTime}
                    </div>
                    <div style={{ color: '#166534', fontSize: '13px', marginTop: '4px' }}>
                      Duration: <strong>{slot.durationMinutes} minutes</strong> ({Math.floor(slot.durationMinutes / 60)}h {slot.durationMinutes % 60}m free)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
