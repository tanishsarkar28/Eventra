import { NextResponse } from 'next/server';
import { readEvents, saveEvents } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';
import { validateVenueAndTime } from '@/lib/venueValidation';

// PATCH /api/events/[id]/status - update event status
export async function PATCH(request, { params }) {
  try {
    // 1. authenticate user
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const events = readEvents();
    const eventIndex = events.findIndex((e) => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    const event = events[eventIndex];

    // 2. check user permissions
    const isOwner = event.organiserId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden. You do not have permission to change this event status.' },
        { status: 403 }
      );
    }

    // 3. parse requested status
    const body = await request.json();
    const { status: targetStatus } = body;

    const validStatuses = ['Draft', 'Pending Approval', 'Published', 'Cancelled'];
    if (!validStatuses.includes(targetStatus)) {
      return NextResponse.json(
        { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. workflow rule: publishing requires admin approval
    if (targetStatus === 'Published') {
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Forbidden. Only administrators can approve and publish events.' },
          { status: 403 }
        );
      }

      // 5. integrate with Module 4: validate venue and time schedule before publishing
      const validationResult = validateVenueAndTime(event, events);
      if (!validationResult.isValid) {
        return NextResponse.json(
          {
            message: validationResult.message,
            reason: 'Module 4 validation failed.',
          },
          { status: 400 }
        );
      }
    }

    // 6. workflow rule: organisers can set Draft, Pending Approval, or Cancelled
    if (isOwner && !isAdmin) {
      if (targetStatus === 'Published') {
        return NextResponse.json(
          { message: 'Organisers cannot directly publish events. Please submit for Pending Approval.' },
          { status: 403 }
        );
      }
    }

    // 7. update status and persist
    event.status = targetStatus;
    event.updatedAt = new Date().toISOString();

    events[eventIndex] = event;
    saveEvents(events);

    return NextResponse.json(
      {
        message: `Event status updated to ${targetStatus}`,
        event: event,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update event status' },
      { status: 500 }
    );
  }
}
