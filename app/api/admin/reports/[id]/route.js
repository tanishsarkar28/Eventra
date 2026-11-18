import { NextResponse } from 'next/server';
import { readReports, saveReports, readEvents, saveEvents } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/auditLogger';
import { emitEvent, EVENT_TYPES } from '@/lib/eventBus';

/**
 * PATCH /api/admin/reports/:id (and /admin/reports/:id via dual-path middleware)
 * 
 * Moderates a flagged event report:
 * Allows administrator to resolve, dismiss, issue warnings, or cancel inappropriate events.
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const reports = readReports();
    const reportIndex = reports.findIndex((r) => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Report not found.' },
        { status: 404 }
      );
    }

    const report = reports[reportIndex];
    const body = await request.json().catch(() => ({}));
    const newStatus = body.status || 'Reviewed';
    const actionTaken = body.actionTaken || (newStatus === 'Dismissed' ? 'Dismissed - False Alarm' : 'Reviewed by Admin');
    const cancelEvent = Boolean(body.cancelEvent);

    report.status = newStatus;
    report.actionTaken = actionTaken;
    report.reviewedBy = user.name || user.email;
    report.reviewedAt = new Date().toISOString();

    let eventCancelled = false;

    // If moderator chose to cancel the reported event
    if (cancelEvent && report.eventId) {
      const events = readEvents();
      const eventIndex = events.findIndex((e) => e.id === report.eventId);
      if (eventIndex !== -1 && events[eventIndex].status !== 'Cancelled') {
        const targetEvent = events[eventIndex];
        targetEvent.status = 'Cancelled';
        targetEvent.updatedAt = new Date().toISOString();
        targetEvent.moderationReason = `Cancelled due to moderation complaint: "${report.reason}"`;

        saveEvents(events);
        eventCancelled = true;

        // Record cancellation in audit log
        recordAuditLog({
          actor: user,
          action: AUDIT_ACTIONS.EVENT_MODERATED_CANCELLED,
          targetType: 'event',
          targetId: targetEvent.id,
          targetTitle: targetEvent.title,
          details: {
            reportId: report.id,
            reason: report.reason,
            actionTaken,
          },
        });

        // Notify registered students and waitlist via Event Bus
        emitEvent(EVENT_TYPES.EVENT_CANCELLED, { event: targetEvent });
      }
    }

    reports[reportIndex] = report;
    saveReports(reports);

    // Record report review in audit log
    recordAuditLog({
      actor: user,
      action: newStatus === 'Dismissed' ? AUDIT_ACTIONS.REPORT_DISMISSED : AUDIT_ACTIONS.REPORT_RESOLVED,
      targetType: 'report',
      targetId: report.id,
      targetTitle: `Report on event "${report.eventTitle}"`,
      details: {
        newStatus,
        actionTaken,
        eventCancelled,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Report ${newStatus.toLowerCase()} successfully.${eventCancelled ? ' Event was cancelled and attendees notified.' : ''}`,
        report,
        eventCancelled,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /admin/reports/:id PATCH] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update report status.' },
      { status: 500 }
    );
  }
}
