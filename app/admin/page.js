'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'pending' | 'moderation' | 'audit' | 'organisers'

  // Admin authentication state
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pendingOrganisers, setPendingOrganisers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Action status messages
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  // Modals & inputs
  const [overrideModalEvent, setOverrideModalEvent] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [rejectionModalEvent, setRejectionModalEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 1. Fetch functions
  async function fetchAnalytics() {
    try {
      const res = await fetch('/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics || null);
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    }
  }

  async function fetchPendingEvents() {
    try {
      const res = await fetch('/admin/pending-events');
      if (res.ok) {
        const data = await res.json();
        setPendingEvents(data.events || []);
      }
    } catch (e) {
      console.error('Failed to load pending events:', e);
    }
  }

  async function fetchReports() {
    try {
      const res = await fetch('/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error('Failed to load reports:', e);
    }
  }

  async function fetchAuditLogs() {
    try {
      const res = await fetch('/admin/audit-log?limit=50');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  }

  async function fetchPendingOrganisers() {
    try {
      const res = await fetch('/api/organisers/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingOrganisers(data.organisers || []);
      }
    } catch (e) {
      console.error('Failed to load pending organisers:', e);
    }
  }

  async function refreshAll() {
    await Promise.all([
      fetchAnalytics(),
      fetchPendingEvents(),
      fetchReports(),
      fetchAuditLogs(),
      fetchPendingOrganisers(),
    ]);
  }

  // 2. Check admin authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role === 'admin') {
            setIsAdmin(true);
            setCurrentUser(data.user);
            await refreshAll();
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  function showToast(msg, isErr = false) {
    setToastMessage(msg);
    setToastError(isErr);
    setTimeout(() => setToastMessage(''), 4500);
  }

  // 3. Actions: Approve Event (with optional clash override)
  async function handleApprove(eventId, adminOverride = false, reason = '') {
    try {
      const payload = {
        action: 'approve',
        adminOverride,
        overrideReason: reason,
      };

      const res = await fetch(`/admin/events/${eventId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          adminOverride
            ? `Event approved with Admin Override! Justification: "${reason}"`
            : 'Event approved and published live!'
        );
        setOverrideModalEvent(null);
        setOverrideReason('');
        await refreshAll();
      } else {
        if (data.canOverride && !adminOverride) {
          const target = pendingEvents.find((e) => e.id === eventId);
          if (target) {
            setOverrideModalEvent(target);
          }
        }
        showToast(data.message || 'Approval failed.', true);
      }
    } catch (e) {
      showToast('Network error while approving event.', true);
    }
  }

  // 4. Actions: Reject Event
  async function handleReject(eventId, reason) {
    try {
      const res = await fetch(`/admin/events/${eventId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Event rejected and returned to Draft with feedback.`);
        setRejectionModalEvent(null);
        setRejectionReason('');
        await refreshAll();
      } else {
        showToast(data.message || 'Rejection failed.', true);
      }
    } catch (e) {
      showToast('Error rejecting event.', true);
    }
  }

  // 5. Actions: Moderate Report (Dismiss or Cancel Event)
  async function handleModerateReport(reportId, actionType, cancelEvent = false) {
    try {
      const res = await fetch(`/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType === 'dismiss' ? 'Dismissed' : 'Action_Taken',
          actionTaken: cancelEvent
            ? 'Event Cancelled by Admin Moderation'
            : actionType === 'dismiss'
            ? 'Dismissed - False Alarm'
            : 'Warning Issued to Organiser',
          cancelEvent,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        await refreshAll();
      } else {
        showToast(data.message || 'Failed to update report.', true);
      }
    } catch (e) {
      showToast('Network error moderating report.', true);
    }
  }

  // 6. Actions: Verify Organiser
  async function handleVerifyOrganiser(orgId) {
    try {
      const res = await fetch('/api/organisers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orgId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Organiser successfully verified and granted event creation rights!');
        await refreshAll();
      } else {
        showToast(data.message || 'Verification failed', true);
      }
    } catch (e) {
      showToast('Failed to verify organiser', true);
    }
  }

  if (isLoading) {
    return <p style={{ padding: '40px', textAlign: 'center' }}>Loading Admin Command Center...</p>;
  }

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: '#dc2626' }}>⛔ Access Denied</h2>
        <p>This page requires System Administrator privileges.</p>
        <Link href="/login" style={{ fontWeight: 600 }}>Please log in with an Administrator Account →</Link>
      </div>
    );
  }

  const overview = analytics?.overview || {};

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛡️ Admin Command Center</span>
            <span style={{ fontSize: '12px', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '9999px', fontWeight: 600 }}>
              Module 9
            </span>
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Campus Oversight, Quality Control, Content Moderation &amp; Real-Time Analytics
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={refreshAll} style={{ fontSize: '13px', background: '#f1f5f9' }}>
            🔄 Refresh Data
          </button>
          <Link href="/venues" style={{ padding: '6px 12px', fontSize: '13px', background: '#f1f5f9', color: '#1e293b', borderRadius: '6px', textDecoration: 'none' }}>
            🏢 Venues Directory
          </Link>
          <Link href="/clash/report" style={{ padding: '6px 12px', fontSize: '13px', background: '#f1f5f9', color: '#1e293b', borderRadius: '6px', textDecoration: 'none' }}>
            🔍 Clash Audit Report
          </Link>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 500,
            background: toastError ? '#fee2e2' : '#dcfce7',
            color: toastError ? '#991b1b' : '#166534',
            border: `1px solid ${toastError ? '#fca5a5' : '#86efac'}`,
          }}
        >
          {toastError ? '⚠️ ' : '✓ '} {toastMessage}
        </div>
      )}

      {/* OVERRIDE MODAL */}
      {overrideModalEvent && (
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '18px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', color: '#b45309' }}>
            ⚡ Administrator Clash Override Authorization
          </h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            Event <strong>&quot;{overrideModalEvent.title}&quot;</strong> has detected scheduling or capacity clashes. You can force-publish this event by providing an official administrative justification reason:
          </p>

          {overrideModalEvent.clashes && overrideModalEvent.clashes.length > 0 && (
            <ul style={{ fontSize: '13px', color: '#9a3412', marginBottom: '12px', paddingLeft: '20px' }}>
              {overrideModalEvent.clashes.map((c, i) => (
                <li key={i}><strong>{c.type}:</strong> {c.message}</li>
              ))}
            </ul>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Justification Reason *:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              placeholder="e.g. Approved by Dean for Annual College Festival (Special Permit)"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (!overrideReason.trim()) {
                  alert('Please enter an administrative override justification.');
                  return;
                }
                handleApprove(overrideModalEvent.id, true, overrideReason.trim());
              }}
              style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              Confirm Override &amp; Publish
            </button>
            <button
              onClick={() => {
                setOverrideModalEvent(null);
                setOverrideReason('');
              }}
              style={{ background: '#f1f5f9' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectionModalEvent && (
        <div
          style={{
            background: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            padding: '18px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', color: '#991b1b' }}>
            ❌ Reject Event Submission: &quot;{rejectionModalEvent.title}&quot;
          </h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#7f1d1d' }}>
            This event will be returned to <strong>Draft</strong> status and the organiser will be notified with your feedback:
          </p>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Reason for Rejection *:</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              placeholder="e.g. Schedule clashes with College Convocation; please adjust timings."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (!rejectionReason.trim()) {
                  alert('Please provide a reason for rejecting the event.');
                  return;
                }
                handleReject(rejectionModalEvent.id, rejectionReason.trim());
              }}
              style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              Confirm Rejection &amp; Return to Draft
            </button>
            <button
              onClick={() => {
                setRejectionModalEvent(null);
                setRejectionReason('');
              }}
              style={{ background: '#f1f5f9' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TAB NAVIGATION PILLS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            background: activeTab === 'analytics' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'analytics' ? '#ffffff' : '#334155',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          📊 Analytics &amp; Insights
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          style={{
            background: activeTab === 'pending' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'pending' ? '#ffffff' : '#334155',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          📋 Pending Events
          {pendingEvents.length > 0 && (
            <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '11px', padding: '1px 6px', borderRadius: '9999px' }}>
              {pendingEvents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          style={{
            background: activeTab === 'moderation' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'moderation' ? '#ffffff' : '#334155',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          🚩 Moderation &amp; Reports
          {reports.filter((r) => r.status === 'Pending').length > 0 && (
            <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '11px', padding: '1px 6px', borderRadius: '9999px' }}>
              {reports.filter((r) => r.status === 'Pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            background: activeTab === 'audit' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'audit' ? '#ffffff' : '#334155',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          🛡️ Audit Log ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('organisers')}
          style={{
            background: activeTab === 'organisers' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'organisers' ? '#ffffff' : '#334155',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          🏢 Organisers
          {pendingOrganisers.length > 0 && (
            <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '11px', padding: '1px 6px', borderRadius: '9999px' }}>
              {pendingOrganisers.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANALYTICS & INSIGHTS (The 5 Module 9 Core Metrics)                 */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div>
          {/* Executive KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Published Events</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>{overview.publishedEvents || 0}</div>
              <div style={{ fontSize: '12px', color: '#059669' }}>Total in catalog: {overview.totalEvents || 0}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Attendance Rate</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#2563eb', margin: '4px 0' }}>{overview.overallAttendanceRate || 0}%</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>{overview.totalAttendance || 0} checked in / {overview.totalRegistrations || 0} reg</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Venue Utilisation</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#7c3aed', margin: '4px 0' }}>{overview.campusVenueUtilisationRate || 0}%</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Across {overview.totalVenues || 0} campus venues</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Clash Rate</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: (analytics?.clashFrequency?.totalClashesDetected || 0) > 0 ? '#ea580c' : '#16a34a', margin: '4px 0' }}>
                {analytics?.clashFrequency?.clashRatePercentage || 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>{analytics?.clashFrequency?.totalClashesDetected || 0} conflicts detected</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Reviews</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: (overview.pendingApprovals || 0) > 0 ? '#d97706' : '#16a34a', margin: '4px 0' }}>
                {(overview.pendingApprovals || 0) + (overview.pendingReports || 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>{overview.pendingApprovals || 0} events, {overview.pendingReports || 0} reports</div>
            </div>
          </div>

          {/* Metric 1 & 2: Two Column Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Metric 1: Events Per Week */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📅 Metric 1: Events Per Week Cadence</h3>
              {(!analytics?.eventsPerWeek || analytics.eventsPerWeek.length === 0) ? (
                <p style={{ fontSize: '13px', color: '#64748b' }}>No dated events scheduled yet.</p>
              ) : (
                <table style={{ margin: 0, fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Calendar Week</th>
                      <th>Total</th>
                      <th>Published</th>
                      <th>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.eventsPerWeek.map((w) => (
                      <tr key={w.week}>
                        <td><strong>{w.week}</strong></td>
                        <td>{w.totalEvents}</td>
                        <td><span style={{ color: '#16a34a', fontWeight: 600 }}>{w.published}</span></td>
                        <td><span style={{ color: '#d97706' }}>{w.pending}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Metric 4: Popular Categories */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>🔥 Metric 4: Popular Categories by Student Demand</h3>
              {(!analytics?.popularCategories || analytics.popularCategories.length === 0) ? (
                <p style={{ fontSize: '13px', color: '#64748b' }}>No category activity recorded yet.</p>
              ) : (
                <table style={{ margin: 0, fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Events</th>
                      <th>Registrations</th>
                      <th>Bookmarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.popularCategories.slice(0, 6).map((c) => (
                      <tr key={c.category}>
                        <td><strong>{c.category}</strong></td>
                        <td>{c.eventCount}</td>
                        <td><span style={{ color: '#2563eb', fontWeight: 600 }}>{c.totalRegistrations}</span></td>
                        <td>{c.totalBookmarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Metric 2: Venue Utilisation */}
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>🏢 Metric 2: Campus Venue Utilisation Breakdown</h3>
            {(!analytics?.venueUtilisation || analytics.venueUtilisation.length === 0) ? (
              <p style={{ fontSize: '13px', color: '#64748b' }}>No venues configured.</p>
            ) : (
              <table style={{ margin: 0, fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Venue Name</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Occupied Hours</th>
                    <th>Available Benchmark</th>
                    <th>Utilisation %</th>
                    <th>Demand Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.venueUtilisation.map((v) => (
                    <tr key={v.venueId}>
                      <td><strong>{v.venueName}</strong></td>
                      <td>{v.type}</td>
                      <td>{v.capacity} seats</td>
                      <td>{v.totalOccupiedHours} hrs</td>
                      <td>{v.benchmarkAvailableHours} hrs</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${v.utilisationPercentage}%`, height: '100%', background: v.utilisationPercentage > 70 ? '#dc2626' : '#2563eb' }} />
                          </div>
                          <span>{v.utilisationPercentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: v.status === 'High Demand' ? '#fee2e2' : v.status === 'Moderate' ? '#dbeafe' : '#f1f5f9',
                            color: v.status === 'High Demand' ? '#991b1b' : v.status === 'Moderate' ? '#1e40af' : '#475569',
                          }}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Metric 3 & 5: Bottom Two Column Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Metric 3: Registration vs Attendance Rate */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>🎟️ Metric 3: Registration vs Gate Check-in Rate</h3>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <div style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Total Confirmed</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{analytics?.registrationVsAttendance?.totalConfirmedRegistrations || 0}</div>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Gate Checked-In</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{analytics?.registrationVsAttendance?.totalCheckedInAttendees || 0}</div>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>No-Show Dropoff</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{analytics?.registrationVsAttendance?.noShowRate || 0}%</div>
                </div>
              </div>

              {analytics?.registrationVsAttendance?.eventBreakdown && analytics.registrationVsAttendance.eventBreakdown.length > 0 ? (
                <table style={{ margin: 0, fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Registered</th>
                      <th>Checked-In</th>
                      <th>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.registrationVsAttendance.eventBreakdown.slice(0, 5).map((ev) => (
                      <tr key={ev.eventId}>
                        <td><strong>{ev.eventTitle}</strong></td>
                        <td>{ev.confirmedRegistrations}</td>
                        <td>{ev.checkedInAttendees}</td>
                        <td><strong>{ev.attendanceRate}%</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: '12px', color: '#64748b' }}>No published event attendance records yet.</p>
              )}
            </div>

            {/* Metric 5: Clash Frequency */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>⚡ Metric 5: Conflict &amp; Clash Frequency</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>
                Module 4 interval overlap conflict occurrences across campus schedules:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Venue Clashes</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{analytics?.clashFrequency?.breakdownByType?.venueClashes || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Capacity Clashes</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{analytics?.clashFrequency?.breakdownByType?.capacityClashes || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Blackout Clashes</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{analytics?.clashFrequency?.breakdownByType?.blackoutClashes || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Organiser Clashes</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{analytics?.clashFrequency?.breakdownByType?.organiserClashes || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Audience Clashes</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{analytics?.clashFrequency?.breakdownByType?.audienceClashes || 0}</div>
                </div>
                <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#1e40af' }}>Total Conflicts</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d4ed8' }}>{analytics?.clashFrequency?.totalClashesDetected || 0}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Link href="/clash/report" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Open Detailed Module 4 Clash Report →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENDING EVENTS & CLASH OVERRIDE (GET /admin/pending-events)        */}
      {/* ========================================================================= */}
      {activeTab === 'pending' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Pending Events for Administrative Approval</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>API: GET /admin/pending-events</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
            Each event is automatically checked for schedule, venue, capacity, and blackout conflicts. Administrators can approve clean events, force-publish with an override reason, or reject with feedback.
          </p>

          {pendingEvents.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎉</div>
              <strong>Zero Pending Events</strong>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>All submitted campus events have been reviewed and published.</p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Club / Organiser</th>
                  <th>Date &amp; Time</th>
                  <th>Venue</th>
                  <th>Capacity</th>
                  <th>Conflict Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <strong>{ev.title}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Category: {ev.category}</div>
                    </td>
                    <td>{ev.clubName || ev.organiserName}</td>
                    <td>{ev.date}<br/><small>{ev.startTime} - {ev.endTime}</small></td>
                    <td>{ev.venue}</td>
                    <td>{ev.capacity} seats</td>
                    <td>
                      {ev.hasClashes ? (
                        <div>
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            ⚠️ {ev.clashCount} Conflict(s)
                          </span>
                          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                            {ev.clashes?.[0]?.type || 'Clash Detected'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          ✓ Conflict-Free
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleApprove(ev.id, false)}
                          style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}
                        >
                          Approve &amp; Publish
                        </button>
                        {ev.hasClashes && (
                          <button
                            onClick={() => {
                              setOverrideModalEvent(ev);
                              setOverrideReason('');
                            }}
                            style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '5px 8px', fontSize: '11px', fontWeight: 600 }}
                          >
                            ⚡ Override
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setRejectionModalEvent(ev);
                            setRejectionReason('');
                          }}
                          style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '5px 8px', fontSize: '11px', fontWeight: 600 }}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MODERATION & REPORTS (GET /admin/reports, PATCH /admin/reports/:id) */}
      {/* ========================================================================= */}
      {activeTab === 'moderation' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Campus Content Moderation &amp; User Reports</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Entity: Report</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
            Review flagged events submitted by students or attendees. Administrators can dismiss reports or take action to cancel inappropriate events and notify all registrants.
          </p>

          {reports.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🛡️</div>
              <strong>Zero Moderation Reports</strong>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No events have been flagged by students.</p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Reported Event</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Date Flagged</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.eventTitle}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Event ID: {r.eventId}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#b91c1c' }}>{r.reason}</span>
                      {r.description && <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>&quot;{r.description}&quot;</div>}
                    </td>
                    <td>{r.reporterName}<br/><small>{r.reporterEmail}</small></td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: r.status === 'Pending' ? '#fef3c7' : r.status === 'Action_Taken' ? '#fee2e2' : '#f1f5f9',
                          color: r.status === 'Pending' ? '#92400e' : r.status === 'Action_Taken' ? '#991b1b' : '#334155',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleModerateReport(r.id, 'dismiss')}
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#f1f5f9' }}
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to cancel the event "${r.eventTitle}"? This will alert all attendees.`)) {
                                handleModerateReport(r.id, 'action', true);
                              }
                            }}
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 600 }}
                          >
                            Take Action &amp; Cancel Event
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Resolved: {r.actionTaken || r.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT LOG (GET /admin/audit-log)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>System Audit Trail &amp; Decisions Log</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>API: GET /admin/audit-log</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
            Immutable administrative records capturing all approvals, overrides, verifications, rejections, and moderation actions.
          </p>

          {auditLogs.length === 0 ? (
            <p style={{ color: '#64748b' }}>No audit records recorded yet.</p>
          ) : (
            <table style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Context Details &amp; Justification</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <strong>{log.actorName}</strong>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{log.actorEmail}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: log.action.includes('REJECT') || log.action.includes('CANCEL') ? '#fee2e2' : log.action.includes('OVERRIDE') ? '#fef3c7' : '#e0f2fe',
                          color: log.action.includes('REJECT') || log.action.includes('CANCEL') ? '#991b1b' : log.action.includes('OVERRIDE') ? '#b45309' : '#0369a1',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <strong>{log.targetTitle}</strong>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{log.targetType} #{log.targetId}</div>
                    </td>
                    <td>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <div style={{ fontSize: '11px', color: '#334155' }}>
                          {log.details.overrideReason && <div><b>Override Reason:</b> {log.details.overrideReason}</div>}
                          {log.details.rejectionReason && <div><b>Rejection:</b> {log.details.rejectionReason}</div>}
                          {log.details.reason && <div><b>Reason:</b> {log.details.reason}</div>}
                          {log.details.actionTaken && <div><b>Action:</b> {log.details.actionTaken}</div>}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ORGANISERS & VENUES QUICK MANAGEMENT                               */}
      {/* ========================================================================= */}
      {activeTab === 'organisers' && (
        <div>
          <h3>Pending Club Organisers Awaiting Verification</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
            Organiser accounts must be approved by administration before they are authorized to create events and request venue reservations.
          </p>

          {pendingOrganisers.length === 0 ? (
            <p style={{ color: '#64748b', marginBottom: '24px' }}>No pending organisers waiting for verification.</p>
          ) : (
            <table style={{ width: '100%', marginBottom: '24px', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Club Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrganisers.map((org) => (
                  <tr key={org.id}>
                    <td><code>{org.id}</code></td>
                    <td><strong>{org.name}</strong></td>
                    <td>{org.email}</td>
                    <td><span style={{ fontWeight: 600, color: '#2563eb' }}>{org.clubName || 'N/A'}</span></td>
                    <td>
                      <button onClick={() => handleVerifyOrganiser(org.id)} style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '5px 12px', fontWeight: 600 }}>
                        Verify Club
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <hr style={{ margin: '24px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>Campus Venues Directory</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>Add new venues, configure operating days, and apply blackout dates.</p>
            </div>
            <Link
              href="/venues"
              style={{
                background: '#2563eb',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Manage Campus Venues →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
