// lib/adminEngine.js
// Simple admin utilities for Eventra
// Uses JSON files in ./data to store audit logs, reports and analytics snapshots.
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');

function _readJson(file) {
  try {
    const full = path.join(dataDir, file);
    const txt = readFileSync(full, 'utf8');
    return JSON.parse(txt);
  } catch (_) {
    return [];
  }
}
function _writeJson(file, arr) {
  const full = path.join(dataDir, file);
  writeFileSync(full, JSON.stringify(arr, null, 2), 'utf8');
}

export function getPendingEvents() {
  const events = _readJson('events.json');
  return events.filter(e => e.status === 'Pending');
}

export function approveEvent(eventId, adminUser) {
  const events = _readJson('events.json');
  const ev = events.find(e => e.id === eventId);
  if (!ev) return { success: false, error: 'Event not found' };
  ev.status = 'Published';
  _writeJson('events.json', events);
  logAction({ type: 'APPROVE_EVENT', eventId, adminId: adminUser.id, adminName: adminUser.name });
  return { success: true, event: ev };
}

export function rejectEvent(eventId, reason, adminUser) {
  const events = _readJson('events.json');
  const ev = events.find(e => e.id === eventId);
  if (!ev) return { success: false, error: 'Event not found' };
  ev.status = 'Rejected';
  ev.rejectionReason = reason;
  _writeJson('events.json', events);
  logAction({ type: 'REJECT_EVENT', eventId, reason, adminId: adminUser.id, adminName: adminUser.name });
  return { success: true, event: ev };
}

export function getAnalytics() {
  // Very light analytics – recompute on the fly from data files.
  const events = _readJson('events.json');
  const registrations = _readJson('registrations.json');
  const attendance = _readJson('attendance.json');
  const venues = _readJson('venues.json');

  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday start
  const eventsThisWeek = events.filter(e => new Date(e.date) >= weekStart).length;

  const venueUtilization = venues.map(v => {
    const bookings = registrations.filter(r => r.eventId === v.id && r.status === 'Confirmed');
    return { venueId: v.id, title: v.title, booked: bookings.length, capacity: v.capacity || 0 };
  });

  const regCount = registrations.filter(r => r.status === 'Confirmed').length;
  const attendCount = attendance.filter(a => a.status === 'CheckedIn').length;

  const popularCategories = {};
  events.forEach(ev => {
    const cat = ev.category || 'Uncategorized';
    popularCategories[cat] = (popularCategories[cat] || 0) + 1;
  });
  const topCategories = Object.entries(popularCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, cnt]) => ({ category: cat, count: cnt }));

  // Clash frequency – count how many events have a clash flag set (from clashEngine)
  const clashFreq = events.filter(e => e.hasClash).length;

  return {
    eventsThisWeek,
    venueUtilization,
    registrationRate: regCount,
    attendanceRate: attendCount,
    attendanceVsReg: regCount ? (attendCount / regCount) * 100 : 0,
    topCategories,
    clashFrequency: clashFreq,
  };
}

export function getAuditLog() {
  return _readJson('auditLog.json');
}

export function logAction(entry) {
  const log = _readJson('auditLog.json');
  const record = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  log.push(record);
  _writeJson('auditLog.json', log);
}

export function reportEvent(eventId, reporterUser, reason) {
  const reports = _readJson('reports.json');
  const report = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId,
    reporterId: reporterUser.id,
    reporterName: reporterUser.name,
    reason,
    timestamp: new Date().toISOString(),
    status: 'Pending',
  };
  reports.push(report);
  _writeJson('reports.json', reports);
  logAction({ type: 'REPORT_EVENT', eventId, reporterId: reporterUser.id, reason });
  return report;
}

export function overrideClash(eventId, adminUser) {
  const events = _readJson('events.json');
  const ev = events.find(e => e.id === eventId);
  if (!ev) return { success: false, error: 'Event not found' };
  ev.hasClash = false;
  _writeJson('events.json', events);
  logAction({ type: 'OVERRIDE_CLASH', eventId, adminId: adminUser.id });
  return { success: true, event: ev };
}
