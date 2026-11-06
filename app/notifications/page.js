'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'reminders' | 'events' | 'tickets'

  // Preferences state
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    inApp: true,
    email: true,
    push: true,
    newEventAlerts: true,
    reminders: true,
    statusUpdates: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Outbox preview state
  const [showOutbox, setShowOutbox] = useState(false);
  const [outboxData, setOutboxData] = useState({ emails: [], push: [] });

  // 1. Fetch user's notifications
  async function fetchNotifications() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/notifications');
      if (res.status === 401) {
        setError('Please log in to view your notifications.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setError(data.error || 'Failed to load notifications.');
      }
    } catch (err) {
      setError('Network error loading notifications.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Fetch user's notification preferences
  async function fetchPreferences() {
    try {
      const res = await fetch('/api/notifications/preferences');
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 3. Fetch simulated outbox data
  async function fetchOutbox() {
    try {
      const res = await fetch('/api/notifications/outbox');
      if (res.ok) {
        const data = await res.json();
        setOutboxData({
          emails: data.emails || [],
          push: data.push || [],
        });
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  // 4. Mark single notification as read
  async function markAsRead(id) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      // ignore
    }
  }

  // 5. Mark all as read
  async function markAllAsRead() {
    try {
      const res = await fetch('/api/notifications/all/read', {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        setSuccessMessage('All notifications marked as read!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      // ignore
    }
  }

  // 6. Clear/Dismiss all notifications
  async function clearAllNotifications() {
    if (!confirm('Are you sure you want to dismiss all notifications?')) return;
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
        setSuccessMessage('Notifications cleared.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      // ignore
    }
  }

  // 7. Save user preferences
  async function savePreferencesSubmit(e) {
    e.preventDefault();
    try {
      setSavingPrefs(true);
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Preferences updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      alert('Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  }

  // 8. Run reminders on-demand
  async function triggerReminderCheck() {
    try {
      const res = await fetch('/api/notifications/reminders/run', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Checked upcoming events: ${data.remindersSentCount} new reminder(s) generated.`);
        fetchNotifications();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (e) {
      alert('Failed to run reminder check.');
    }
  }

  // Filter helper
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'reminders') return n.type === 'reminder_24h' || n.type === 'reminder_1h';
    if (activeFilter === 'events') {
      return (
        n.type === 'new_event' ||
        n.type === 'venue_change' ||
        n.type === 'schedule_change' ||
        n.type === 'event_cancelled' ||
        n.type === 'event_updated'
      );
    }
    if (activeFilter === 'tickets') {
      return (
        n.type === 'registration_confirmation' ||
        n.type === 'waitlist_promotion' ||
        n.type === 'organiser_registration'
      );
    }
    return true;
  });

  function getTypeBadge(type) {
    switch (type) {
      case 'new_event':
        return { label: '📢 New Event', bg: '#e0f2fe', color: '#0369a1' };
      case 'registration_confirmation':
        return { label: '🎟️ Confirmed Ticket', bg: '#dcfce7', color: '#15803d' };
      case 'reminder_24h':
        return { label: '⏰ 24h Reminder', bg: '#fef3c7', color: '#b45309' };
      case 'reminder_1h':
        return { label: '🚨 1h Final Call', bg: '#fee2e2', color: '#b91c1c' };
      case 'venue_change':
        return { label: '📍 Venue Changed', bg: '#ede9fe', color: '#6d28d9' };
      case 'schedule_change':
        return { label: '⏰ Time Changed', bg: '#ffedd5', color: '#c2410c' };
      case 'event_cancelled':
        return { label: '❌ Cancelled', bg: '#fee2e2', color: '#991b1b' };
      case 'waitlist_promotion':
        return { label: '🚀 Promoted', bg: '#f0fdf4', color: '#166534' };
      case 'organiser_registration':
        return { label: '👤 New Attendee', bg: '#e0e7ff', color: '#3730a3' };
      case 'event_approval':
        return { label: '✅ Event Approved', bg: '#dcfce7', color: '#166534' };
      case 'organiser_verified':
        return { label: '🎉 Verified Club', bg: '#fae8ff', color: '#86198f' };
      default:
        return { label: '🔔 Alert', bg: '#f1f5f9', color: '#334155' };
    }
  }

  function formatTime(isoStr) {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔔 Notifications & Reminders</span>
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                }}
              >
                {unreadCount} New
              </span>
            )}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Module 7: Event-driven alerts, reminders, and multi-channel notification engine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowPreferences(!showPreferences)}
            style={{
              backgroundColor: showPreferences ? '#2563eb' : '#f1f5f9',
              color: showPreferences ? '#ffffff' : '#334155',
            }}
          >
            ⚙️ Preferences
          </button>
          <button
            type="button"
            onClick={triggerReminderCheck}
            title="Evaluate upcoming events for 24h & 1h reminders right now"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            ⏱️ Run Reminders
          </button>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            style={{ backgroundColor: '#f1f5f9' }}
          >
            ✓ Mark All Read
          </button>
          <button
            type="button"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            style={{ backgroundColor: '#f1f5f9', color: '#991b1b' }}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Success alert message */}
      {successMessage && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            padding: '10px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      {/* Error alert message */}
      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          ⚠️ {error} {error.includes('log in') && <Link href="/login" style={{ fontWeight: '600', marginLeft: '6px' }}>Go to Login →</Link>}
        </div>
      )}

      {/* Collapsible Notification Preferences Panel */}
      {showPreferences && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '18px 22px',
            marginBottom: '22px',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a' }}>
            ⚙️ Notification Preferences (Entity: NotificationPreference)
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
            Control which channels and alert categories you want to receive:
          </p>

          <form onSubmit={savePreferencesSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.inApp}
                  onChange={(e) => setPreferences({ ...preferences, inApp: e.target.checked })}
                />
                <span>🔔 In-App Notifications</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.email}
                  onChange={(e) => setPreferences({ ...preferences, email: e.target.checked })}
                />
                <span>✉️ Email Outbox Channel</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.push}
                  onChange={(e) => setPreferences({ ...preferences, push: e.target.checked })}
                />
                <span>📱 Push Notification Channel</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.newEventAlerts}
                  onChange={(e) => setPreferences({ ...preferences, newEventAlerts: e.target.checked })}
                />
                <span>📢 New Events Matching Interests</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.reminders}
                  onChange={(e) => setPreferences({ ...preferences, reminders: e.target.checked })}
                />
                <span>⏰ Reminders (24h & 1h Before)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.statusUpdates}
                  onChange={(e) => setPreferences({ ...preferences, statusUpdates: e.target.checked })}
                />
                <span>⚠️ Venue & Schedule Changes</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="submit" disabled={savingPrefs}>
                {savingPrefs ? 'Saving...' : '💾 Save Preferences (PUT /notifications/preferences)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOutbox(!showOutbox);
                  if (!showOutbox) fetchOutbox();
                }}
                style={{ backgroundColor: '#f1f5f9' }}
              >
                {showOutbox ? 'Hide Outbox Logs' : '📬 Inspect Simulated Email/Push Outbox'}
              </button>
            </div>
          </form>

          {/* Simulated Outbox Drawer */}
          {showOutbox && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>
                📬 Multi-Channel Simulated Outbox Log (Email & Push Transmissions)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <strong>Emails Sent ({outboxData.emails.length})</strong>
                  {outboxData.emails.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#64748b' }}>No emails recorded yet.</p>
                  ) : (
                    <ul style={{ paddingLeft: '16px', margin: '6px 0', fontSize: '12px' }}>
                      {outboxData.emails.slice(0, 5).map((em) => (
                        <li key={em.id} style={{ marginBottom: '6px' }}>
                          <b>{em.subject}</b><br/>
                          <span style={{ color: '#64748b' }}>To: {em.to} • Status: {em.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <strong>Push Alerts Sent ({outboxData.push.length})</strong>
                  {outboxData.push.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#64748b' }}>No push alerts recorded yet.</p>
                  ) : (
                    <ul style={{ paddingLeft: '16px', margin: '6px 0', fontSize: '12px' }}>
                      {outboxData.push.slice(0, 5).map((p) => (
                        <li key={p.id} style={{ marginBottom: '6px' }}>
                          <b>{p.title}</b><br/>
                          <span style={{ color: '#64748b' }}>Status: {p.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          style={{
            backgroundColor: activeFilter === 'all' ? '#2563eb' : '#f1f5f9',
            color: activeFilter === 'all' ? '#ffffff' : '#334155',
            padding: '6px 14px',
            fontSize: '13px',
          }}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('unread')}
          style={{
            backgroundColor: activeFilter === 'unread' ? '#2563eb' : '#f1f5f9',
            color: activeFilter === 'unread' ? '#ffffff' : '#334155',
            padding: '6px 14px',
            fontSize: '13px',
          }}
        >
          Unread ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('reminders')}
          style={{
            backgroundColor: activeFilter === 'reminders' ? '#2563eb' : '#f1f5f9',
            color: activeFilter === 'reminders' ? '#ffffff' : '#334155',
            padding: '6px 14px',
            fontSize: '13px',
          }}
        >
          ⏰ Reminders
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('events')}
          style={{
            backgroundColor: activeFilter === 'events' ? '#2563eb' : '#f1f5f9',
            color: activeFilter === 'events' ? '#ffffff' : '#334155',
            padding: '6px 14px',
            fontSize: '13px',
          }}
        >
          📢 Events & Updates
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('tickets')}
          style={{
            backgroundColor: activeFilter === 'tickets' ? '#2563eb' : '#f1f5f9',
            color: activeFilter === 'tickets' ? '#ffffff' : '#334155',
            padding: '6px 14px',
            fontSize: '13px',
          }}
        >
          🎟️ Tickets & Passes
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>✨</div>
          <h3 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>You're all caught up!</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            {activeFilter === 'unread'
              ? 'No unread notifications at the moment.'
              : 'No notifications match your current filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map((n) => {
            const badge = getTypeBadge(n.type);
            const isUnread = !n.isRead;

            return (
              <div
                key={n.id}
                style={{
                  backgroundColor: isUnread ? '#f0f9ff' : '#ffffff',
                  border: isUnread ? '1px solid #7dd3fc' : '1px solid #e2e8f0',
                  borderLeft: isUnread ? '4px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  boxShadow: isUnread ? '0 1px 3px rgba(2, 132, 199, 0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                      }}
                    >
                      {badge.label}
                    </span>

                    {Array.isArray(n.channels) && (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        via {n.channels.join(', ')}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {formatTime(n.createdAt)}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>
                  {n.title}
                </h4>

                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                  {n.message}
                </p>

                {/* Metadata Details Box */}
                {n.metadata && (n.metadata.ticketCode || n.metadata.venue || n.metadata.date) && (
                  <div
                    style={{
                      backgroundColor: isUnread ? '#e0f2fe' : '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#475569',
                      marginBottom: '10px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    {n.metadata.ticketCode && (
                      <div>
                        <b>Ticket:</b> <code>{n.metadata.ticketCode}</code>
                      </div>
                    )}
                    {n.metadata.venue && (
                      <div>
                        <b>Venue:</b> {n.metadata.venue}
                      </div>
                    )}
                    {n.metadata.date && (
                      <div>
                        <b>Date:</b> {n.metadata.date} {n.metadata.startTime && `(${n.metadata.startTime})`}
                      </div>
                    )}
                  </div>
                )}

                {/* Card actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    {n.metadata?.eventId && (
                      <Link
                        href={`/events/${n.metadata.eventId}`}
                        style={{ fontSize: '13px', fontWeight: '500' }}
                      >
                        View Event Details →
                      </Link>
                    )}
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      ✓ Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
