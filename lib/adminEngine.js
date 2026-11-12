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

export function getPendingEvents() {
  const events = _readJson('events.json');
  return events.filter(e => e.status === 'Pending' || e.status === 'Pending Approval');
}

export function approveEvent(eventId, adminUser) {
  const events = _readJson('events.json');
  const ev = events.find(e => e.id === eventId);
  if (!ev) return { success: false, error: 'Event not found' };
  ev.status = 'Published';
  _writeJson('events.json', events);
  logAction({
    adminId: adminUser?.id,
    adminName: adminUser?.name,
    action: 'APPROVE_EVENT',
    entityType: 'EVENT',
    entityId: eventId,
    description: `Event "${ev.title}" approved`,
  });
  return { success: true, event: ev };
}

export function rejectEvent(eventId, reason, adminUser) {
  const events = _readJson('events.json');
  const ev = events.find(e => e.id === eventId);
  if (!ev) return { success: false, error: 'Event not found' };
  ev.status = 'Rejected';
  ev.rejectionReason = reason;
  _writeJson('events.json', events);
  logAction({
    adminId: adminUser?.id,
    adminName: adminUser?.name,
    action: 'REJECT_EVENT',
    entityType: 'EVENT',
    entityId: eventId,
    description: `Event "${ev.title}" rejected: ${reason}`,
  });
  return { success: true, event: ev };
}

export function overrideClash(eventId, adminUser, reason = 'Administrative override') {
  const events = _readJson('events.json');
  const ev = events.find(e => e.id === eventId);
  if (!ev) return { success: false, error: 'Event not found' };
  ev.hasClash = false;
  ev.clashOverrideReason = reason;
  _writeJson('events.json', events);
  logAction({
    adminId: adminUser?.id,
    adminName: adminUser?.name,
    action: 'OVERRIDE_CLASH',
    entityType: 'EVENT',
    entityId: eventId,
    description: `Clash overridden for "${ev.title}": ${reason}`,
  });
  return { success: true, event: ev };
}

export function getOrganisers() {
  const users = _readJson('users.json');
  return users.filter(u => u.role === 'organiser');
}

export function setOrganiserStatus(userId, active, adminUser) {
  const users = _readJson('users.json');
  const usr = users.find(u => u.id === userId);
  if (!usr) return { success: false, error: 'Organiser not found' };
  usr.isActive = active;
  _writeJson('users.json', users);
  logAction({
    adminId: adminUser?.id,
    adminName: adminUser?.name,
    action: active ? 'ACTIVATE_ORGANISER' : 'DEACTIVATE_ORGANISER',
    entityType: 'ORGANISER',
    entityId: userId,
    description: `${active ? 'Activated' : 'Deactivated'} organiser ${usr.name}`,
  });
  return { success: true, user: usr };
}

export function getVenues() {
  return _readJson('venues.json');
}

export function upsertVenue(venue, adminUser) {
  const venues = _readJson('venues.json');
  const idx = venues.findIndex(v => v.id === venue.id);
  if (idx >= 0) {
    venues[idx] = { ...venues[idx], ...venue };
  } else {
    venues.push(venue);
  }
  _writeJson('venues.json', venues);
  logAction({
    adminId: adminUser?.id,
    adminName: adminUser?.name,
    action: idx >= 0 ? 'UPDATE_VENUE' : 'CREATE_VENUE',
    entityType: 'VENUE',
    entityId: venue.id,
    description: `${idx >= 0 ? 'Updated' : 'Created'} venue ${venue.title || venue.name}`,
  });
  return { success: true, venue };
}

export function deleteVenue(venueId, adminUser) {
  const venues = _readJson('venues.json');
  const filtered = venues.filter(v => v.id !== venueId);
  _writeJson('venues.json', filtered);
  logAction({
    adminId: adminUser?.id,
    adminName: adminUser?.name,
    action: 'DELETE_VENUE',
    entityType: 'VENUE',
    entityId: venueId,
    description: `Deleted venue ${venueId}`,
  });
  return { success: true };
}

export function getReports() {
  return _readJson('reports.json');
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
  logAction({
    adminId: reporterUser.id,
    adminName: reporterUser.name,
    action: 'REPORT_EVENT',
    entityType: 'EVENT',
    entityId: eventId,
    description: `Event ${eventId} reported: ${reason}`,
  });
  return report;
}

export function resolveReport(reportId, adminUser, resolution = 'Resolved') {
  const reports = _readJson('reports.json');
  const rep = reports.find(r => r.id === reportId);
  if (!rep) return { success: false, error: 'Report not found' };
  rep.status = resolution;
  rep.resolvedAt = new Date().toISOString();
  _writeJson('reports.json', reports);
  logAction({
    adminId: adminUser?.id,
    adminName: adminUser?.name,
    action: resolution === 'Dismissed' ? 'DISMISS_REPORT' : 'RESOLVE_REPORT',
    entityType: 'REPORT',
    entityId: reportId,
    description: `${resolution} report for event ${rep.eventId}`,
  });
  return { success: true, report: rep };
}

export function getAnalytics() {
  const events = _readJson('events.json');
  const registrations = _readJson('registrations.json');
  const attendance = _readJson('attendance.json');
  const venues = _readJson('venues.json');
  const users = _readJson('users.json');
  const reports = _readJson('reports.json');

  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const eventsThisWeek = events.filter(e => new Date(e.date) >= weekStart).length;

  const venueUtilization = venues.map(v => {
    const bookings = registrations.filter(r => r.eventId === v.id && r.status === 'Confirmed');
    return {
      venueId: v.id,
      title: v.title || v.name,
      booked: bookings.length,
      capacity: v.capacity || 0,
      utilisationPct: v.capacity > 0 ? Math.round((bookings.length / v.capacity) * 100) : 0,
    };
  });

  const regCount = registrations.filter(r => r.status === 'Confirmed').length;
  const attendCount = attendance.filter(a => a.status === 'CheckedIn' || a.attended === true).length;

  const popularCategories = {};
  events.forEach(ev => {
    const cat = ev.category || 'General';
    popularCategories[cat] = (popularCategories[cat] || 0) + 1;
  });
  const topCategories = Object.entries(popularCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, cnt]) => ({ category: cat, count: cnt }));

  const clashFreq = events.filter(e => e.hasClash).length;
  const approved = events.filter(e => e.status === 'Published').length;
  const rejected = events.filter(e => e.status === 'Rejected').length;
  const pending = events.filter(e => e.status === 'Pending' || e.status === 'Pending Approval').length;
  const organisers = users.filter(u => u.role === 'organiser').length;

  return {
    totalEvents: events.length,
    eventsThisWeek,
    pending,
    approved,
    rejected,
    totalOrganisers: organisers,
    totalVenues: venues.length,
    totalReports: reports.length,
    venueUtilization,
    registrationRate: regCount,
    attendanceRate: attendCount,
    attendanceVsReg: regCount ? Math.round((attendCount / regCount) * 100) : 0,
    topCategories,
    clashFrequency: clashFreq,
  };
}

export function getAuditLog() {
  return _readJson('auditLog.json');
}
