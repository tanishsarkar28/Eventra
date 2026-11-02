'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClashReportPage() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  async function fetchReport() {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clash/report');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        setError('Failed to load clash report.');
      }
    } catch (err) {
      setError('Network error while fetching clash report.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2>Module 4: Venue &amp; Clash Management Report</h2>
        <p>Scanning campus schedule and checking for interval conflicts...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div>
        <h2>Module 4: Venue &amp; Clash Management Report</h2>
        <p style={{ color: 'red' }}>{error || 'Unable to load report.'}</p>
        <button onClick={fetchReport}>Try Again</button>
      </div>
    );
  }

  // Filter incidents based on active tab
  const filteredReports = (report.reports || []).filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRITICAL') return item.hasCriticalClash;
    if (activeFilter === 'VENUE') return item.clashes.some((c) => c.type === 'Venue clash');
    if (activeFilter === 'CAPACITY') return item.clashes.some((c) => c.type === 'Capacity clash');
    if (activeFilter === 'ORGANISER') return item.clashes.some((c) => c.type === 'Organiser clash');
    if (activeFilter === 'AUDIENCE') return item.clashes.some((c) => c.type === 'Audience clash');
    if (activeFilter === 'BLACKOUT') return item.clashes.some((c) => c.type === 'Blackout clash');
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Module 4: Venue &amp; Clash Management Report</h2>
          <small style={{ color: '#64748b' }}>
            Validation engine detecting schedule, capacity, organiser, audience, and blackout conflicts.
          </small>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchReport}
            style={{
              padding: '6px 12px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            🔄 Refresh Scan
          </button>
          <Link
            href="/admin"
            style={{
              padding: '6px 12px',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              alignSelf: 'center',
            }}
          >
            Admin Panel →
          </Link>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#475569', marginBottom: '20px' }}>
        Last scanned at: <strong>{new Date(report.generatedAt).toLocaleString()}</strong> | Total events scanned: <strong>{report.totalEventsChecked}</strong>
      </p>

      {/* KPI METRIC CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: report.totalClashesFound > 0 ? '#dc2626' : '#16a34a' }}>
            {report.totalClashesFound}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Total Clashes</div>
        </div>

        <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
            {report.breakdownByType.venueClashes}
          </div>
          <div style={{ fontSize: '12px', color: '#991b1b' }}>Venue Clashes</div>
        </div>

        <div style={{ padding: '12px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>
            {report.breakdownByType.capacityClashes}
          </div>
          <div style={{ fontSize: '12px', color: '#c2410c' }}>Capacity Clashes</div>
        </div>

        <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
            {report.breakdownByType.organiserClashes}
          </div>
          <div style={{ fontSize: '12px', color: '#b45309' }}>Organiser Clashes</div>
        </div>

        <div style={{ padding: '12px', background: '#f0fdfa', borderRadius: '8px', border: '1px solid #ccfbf1', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0d9488' }}>
            {report.breakdownByType.audienceClashes}
          </div>
          <div style={{ fontSize: '12px', color: '#0f766e' }}>Audience Clashes</div>
        </div>

        <div style={{ padding: '12px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #f3e8ff', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9333ea' }}>
            {report.breakdownByType.blackoutClashes}
          </div>
          <div style={{ fontSize: '12px', color: '#7e22ce' }}>Blackout Clashes</div>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        {[
          { key: 'ALL', label: `All Incidents (${report.reports.length})` },
          { key: 'CRITICAL', label: `Critical (${report.breakdownBySeverity.critical})` },
          { key: 'VENUE', label: `Venue (${report.breakdownByType.venueClashes})` },
          { key: 'CAPACITY', label: `Capacity (${report.breakdownByType.capacityClashes})` },
          { key: 'ORGANISER', label: `Organiser (${report.breakdownByType.organiserClashes})` },
          { key: 'AUDIENCE', label: `Audience (${report.breakdownByType.audienceClashes})` },
          { key: 'BLACKOUT', label: `Blackout (${report.breakdownByType.blackoutClashes})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: activeFilter === tab.key ? '1px solid #2563eb' : '1px solid #cbd5e1',
              background: activeFilter === tab.key ? '#2563eb' : '#ffffff',
              color: activeFilter === tab.key ? '#ffffff' : '#334155',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REPORT LIST */}
      {filteredReports.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 6px 0', color: '#16a34a' }}>🎉 No Schedule Clashes!</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            All campus events and venue bookings are properly spaced with zero interval overlaps or capacity issues.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredReports.map((item, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #e2e8f0',
                borderLeft: item.hasCriticalClash ? '4px solid #ef4444' : '4px solid #f97316',
                borderRadius: '8px',
                padding: '16px',
                background: '#ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a' }}>
                    {item.event.title}
                  </h4>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    📍 <strong>{item.event.venue}</strong> | 📅 {item.event.date} ({item.event.startTime} - {item.event.endTime}) | 👥 Cap: {item.event.capacity} | 🎓 Audience: {item.event.targetAudience}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: item.event.status === 'Published' ? '#dcfce7' : '#fef9c3',
                      color: item.event.status === 'Published' ? '#15803d' : '#854d0e',
                    }}
                  >
                    Status: {item.event.status}
                  </span>
                  {item.event.adminOverride && (
                    <div style={{ marginTop: '4px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          background: '#e0e7ff',
                          color: '#3730a3',
                        }}
                      >
                        ⚡ Admin Overridden
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* LIST OF CLASHES FOR THIS EVENT */}
              <div style={{ marginTop: '12px', background: '#f8fafc', borderRadius: '6px', padding: '12px' }}>
                <strong style={{ fontSize: '13px', color: '#334155' }}>
                  Detected Conflicts ({item.clashes.length}):
                </strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '13px' }}>
                  {item.clashes.map((c, cIdx) => (
                    <li key={cIdx} style={{ marginBottom: '8px' }}>
                      <span
                        style={{
                          background: c.severity === 'CRITICAL' ? '#ef4444' : c.severity === 'HIGH' ? '#ea580c' : '#eab308',
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
                        <div style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>
                          💡 <em>Remedy: {c.remedy}</em>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {item.event.adminOverride && item.event.overrideReason && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#4338ca', fontStyle: 'italic' }}>
                  Override Note: &quot;{item.event.overrideReason}&quot;
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
