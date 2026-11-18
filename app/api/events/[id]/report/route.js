import { NextResponse } from 'next/server';
import { readEvents, readReports, saveReports } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/auditLogger';

/**
 * POST /api/events/:id/report (and /events/:id/report)
 * 
 * Allows students or campus members to report/flag an inappropriate, misleading,
 * or unsafe campus event for administrative review.
 */
export async function POST(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in to report an event.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const events = readEvents();
    const event = events.find((e) => e.id === id);

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found.' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body.reason || 'Inappropriate Content').trim();
    const description = (body.description || '').trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, message: 'Please select a reason for reporting.' },
        { status: 400 }
      );
    }

    const reports = readReports();

    // Check if user already has an active pending report for this event
    const existing = reports.find(
      (r) => r.eventId === id && r.reporterId === user.id && r.status === 'Pending'
    );
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: 'You have already reported this event. Our moderation team is currently reviewing it.',
          report: existing,
        },
        { status: 200 }
      );
    }

    const newReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventId: event.id,
      eventTitle: event.title,
      organiserId: event.organiserId,
      organiserName: event.organiserName,
      clubName: event.clubName || '',
      reporterId: user.id,
      reporterName: user.name,
      reporterEmail: user.email,
      reason,
      description,
      status: 'Pending', // 'Pending' | 'Reviewed' | 'Dismissed' | 'Action_Taken'
      actionTaken: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    };

    reports.unshift(newReport);
    saveReports(reports);

    // Record in audit log
    recordAuditLog({
      actor: user,
      action: AUDIT_ACTIONS.REPORT_CREATED,
      targetType: 'report',
      targetId: newReport.id,
      targetTitle: `Report against "${event.title}"`,
      details: {
        eventId: event.id,
        reason,
        description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully. Thank you for keeping our campus safe.',
        report: newReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /events/:id/report POST] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit event report.' },
      { status: 500 }
    );
  }
}
