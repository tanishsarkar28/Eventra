import { NextResponse } from 'next/server';
import { readEvents, saveEvents, readVenues, readBookings, saveBookings } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';
import { validateVenueAndTime } from '@/lib/venueValidation';
import { recordAuditLog, AUDIT_ACTIONS } from '@/lib/auditLogger';
import { emitEvent, EVENT_TYPES } from '@/lib/eventBus';
import { createNotification } from '@/lib/notifications';

/**
 * PATCH /api/admin/events/:id/approve (and /admin/events/:id/approve)
 * 
 * Centralised moderation endpoint for approving (with optional clash override)
 * or rejecting pending events.
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
    const events = readEvents();
    const eventIndex = events.findIndex((e) => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Event not found.' },
        { status: 404 }
      );
    }

    const event = events[eventIndex];
    const body = await request.json().catch(() => ({}));
    const action = (body.action || 'approve').toLowerCase();

    // -------------------------------------------------------------
    // Branch A: REJECT EVENT
    // -------------------------------------------------------------
    if (action === 'reject') {
      const rejectionReason = (body.rejectionReason || body.reason || 'Does not meet campus event guidelines').trim();

      event.status = 'Draft';
      event.rejectionReason = rejectionReason;
      event.rejectedBy = user.name || user.email;
      event.rejectedAt = new Date().toISOString();
      event.updatedAt = new Date().toISOString();

      events[eventIndex] = event;
      saveEvents(events);

      // 1. Record in immutable AuditLog
      recordAuditLog({
        actor: user,
        action: AUDIT_ACTIONS.EVENT_REJECTED,
        targetType: 'event',
        targetId: event.id,
        targetTitle: event.title,
        details: {
          rejectionReason,
          previousStatus: 'Pending Approval',
          newStatus: 'Draft',
        },
      });

      // 2. Notify the club organiser
      if (event.organiserId) {
        createNotification({
          userId: event.organiserId,
          title: `❌ Event Review: "${event.title}" Rejected`,
          message: `Your event submission "${event.title}" was rejected by admin. Reason: ${rejectionReason}. Status returned to Draft for editing.`,
          type: 'event_updated',
          channels: ['in_app', 'email'],
          metadata: {
            eventId: event.id,
            eventTitle: event.title,
            rejectionReason,
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: `Event "${event.title}" was rejected and returned to Draft.`,
          event,
        },
        { status: 200 }
      );
    }

    // -------------------------------------------------------------
    // Branch B: APPROVE EVENT (with Module 4 clash check & override)
    // -------------------------------------------------------------
    const { adminOverride, overrideReason } = body;

    // Validate venue and time schedule
    const validationResult = validateVenueAndTime(event, events, {
      adminOverride: Boolean(adminOverride),
      overrideReason: overrideReason || '',
    });

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: validationResult.message,
          reason: 'Module 4 validation conflict detected.',
          clashes: validationResult.clashes || [],
          canOverride: true,
        },
        { status: 400 }
      );
    }

    // Update event record
    event.status = 'Published';
    event.updatedAt = new Date().toISOString();

    if (validationResult.isOverridden) {
      event.adminOverride = true;
      event.overrideReason = overrideReason.trim();
      event.overriddenBy = user.name || user.email;
      event.overriddenAt = new Date().toISOString();
    }

    events[eventIndex] = event;
    saveEvents(events);

    // Synchronize venue bookings
    try {
      const venues = readVenues();
      const matchedVenue = venues.find(
        (v) => (v.name || '').trim().toLowerCase() === (event.venue || '').trim().toLowerCase()
      );
      if (matchedVenue) {
        const bookings = readBookings();
        const existingBookingIndex = bookings.findIndex((b) => b.eventId === event.id);

        if (existingBookingIndex !== -1) {
          bookings[existingBookingIndex].status = 'Confirmed';
          bookings[existingBookingIndex].updatedAt = new Date().toISOString();
        } else {
          bookings.push({
            id: Date.now().toString(),
            venueId: matchedVenue.id,
            venueName: matchedVenue.name,
            type: 'booking',
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            title: event.title,
            reason: '',
            note: `Published Event: ${event.title}`,
            eventId: event.id,
            requestedBy: event.organiserId,
            requestedByName: event.organiserName,
            status: 'Confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        saveBookings(bookings);
      }
    } catch (bookingError) {
      console.error('[API /admin/events/:id/approve] Booking sync error:', bookingError);
    }

    // Record in AuditLog
    recordAuditLog({
      actor: user,
      action: validationResult.isOverridden
        ? AUDIT_ACTIONS.CLASH_OVERRIDDEN
        : AUDIT_ACTIONS.EVENT_APPROVED,
      targetType: 'event',
      targetId: event.id,
      targetTitle: event.title,
      details: {
        adminOverride: Boolean(adminOverride),
        overrideReason: overrideReason || null,
        clashesOverridden: validationResult.isOverridden ? (validationResult.clashes || []) : [],
      },
    });

    // Module 7: Trigger event bus notifications
    emitEvent(EVENT_TYPES.EVENT_APPROVED, { event, approver: user });
    emitEvent(EVENT_TYPES.EVENT_PUBLISHED, { event });

    return NextResponse.json(
      {
        success: true,
        message: validationResult.isOverridden
          ? `Event approved with Admin Override! Justification: "${overrideReason}"`
          : 'Event approved and published successfully!',
        event,
        isOverridden: Boolean(validationResult.isOverridden),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /admin/events/:id/approve PATCH] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while approving event.' },
      { status: 500 }
    );
  }
}
