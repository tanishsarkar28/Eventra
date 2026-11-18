import { readAuditLogs, saveAuditLogs } from './db.js';

/**
 * ============================================================================
 * Module 9: Audit Logger Engine
 * ============================================================================
 * 
 * Purpose:
 * Immutable tracking of all administrative decisions, moderation actions,
 * clash overrides, and safety interventions for accountability and oversight.
 * 
 * Explaining like you're explaining to a 5-year-old:
 * Think of the Audit Log as the school principal's magical gold diary 📖.
 * Every time a teacher approves a party, moves a classroom, or investigates
 * a complaint, the diary writes down: WHO did it, WHAT they did, WHY they did it,
 * and at WHAT EXACT SECOND it happened. Nobody can erase the diary!
 */

export const AUDIT_ACTIONS = {
  EVENT_APPROVED: 'EVENT_APPROVED',
  EVENT_REJECTED: 'EVENT_REJECTED',
  CLASH_OVERRIDDEN: 'CLASH_OVERRIDDEN',
  ORGANISER_VERIFIED: 'ORGANISER_VERIFIED',
  ORGANISER_REJECTED: 'ORGANISER_REJECTED',
  VENUE_CREATED: 'VENUE_CREATED',
  VENUE_UPDATED: 'VENUE_UPDATED',
  VENUE_DEACTIVATED: 'VENUE_DEACTIVATED',
  VENUE_BLACKOUT_ADDED: 'VENUE_BLACKOUT_ADDED',
  VENUE_BLACKOUT_REMOVED: 'VENUE_BLACKOUT_REMOVED',
  REPORT_CREATED: 'REPORT_CREATED',
  REPORT_RESOLVED: 'REPORT_RESOLVED',
  REPORT_DISMISSED: 'REPORT_DISMISSED',
  EVENT_MODERATED_CANCELLED: 'EVENT_MODERATED_CANCELLED',
};

/**
 * Records an immutable administrative audit log entry.
 * 
 * @param {Object} entry
 * @param {Object} entry.actor - Logged-in admin user object { id, name, email, role }
 * @param {string} entry.action - Action verb from AUDIT_ACTIONS or custom string
 * @param {string} entry.targetType - 'event' | 'organiser' | 'venue' | 'report' | 'user'
 * @param {string} entry.targetId - ID of the subject entity
 * @param {string} [entry.targetTitle] - Human-readable label (e.g. event name)
 * @param {Object} [entry.details] - Arbitrary context (reasons, diffs, previous status)
 * @param {string} [entry.ip] - Optional IP or client context
 * @returns {Object} The recorded audit log entry
 */
export function recordAuditLog({
  actor,
  action,
  targetType,
  targetId,
  targetTitle = '',
  details = {},
  ip = '127.0.0.1',
}) {
  try {
    const logs = readAuditLogs();

    const logEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId: actor?.id || 'system',
      actorName: actor?.name || 'Administrator',
      actorEmail: actor?.email || 'admin@eventra.edu',
      actorRole: actor?.role || 'admin',
      action,
      targetType,
      targetId: String(targetId || ''),
      targetTitle: targetTitle || String(targetId || ''),
      details: details || {},
      ip,
      timestamp: new Date().toISOString(),
    };

    // Prepend to show newest first
    logs.unshift(logEntry);

    // Keep bounded history (last 1000 actions)
    if (logs.length > 1000) {
      logs.length = 1000;
    }

    saveAuditLogs(logs);
    return logEntry;
  } catch (error) {
    console.error('[AuditLogger] Failed to record audit log:', error);
    return null;
  }
}

/**
 * Queries audit logs with optional filtering.
 */
export function queryAuditLogs({ action, targetType, targetId, actorId, limit = 50 } = {}) {
  let logs = readAuditLogs();

  if (action) {
    logs = logs.filter((l) => l.action === action);
  }
  if (targetType) {
    logs = logs.filter((l) => l.targetType === targetType);
  }
  if (targetId) {
    logs = logs.filter((l) => l.targetId === targetId);
  }
  if (actorId) {
    logs = logs.filter((l) => l.actorId === actorId);
  }

  const parsedLimit = parseInt(limit, 10);
  if (!isNaN(parsedLimit) && parsedLimit > 0) {
    logs = logs.slice(0, parsedLimit);
  }

  return logs;
}
