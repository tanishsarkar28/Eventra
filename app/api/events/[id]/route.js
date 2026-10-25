import { NextResponse } from 'next/server';
import { readEvents, saveEvents } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

// GET /api/events/[id] - get single event details
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const events = readEvents();
    const event = events.find((e) => e.id === id);

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - update an existing event
export async function PUT(request, { params }) {
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

    const currentEvent = events[eventIndex];

    // 2. authorization check: only creator organiser or admin can edit
    if (currentEvent.organiserId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden. You can only edit your own events.' },
        { status: 403 }
      );
    }

    // 3. do not allow editing cancelled events
    if (currentEvent.status === 'Cancelled') {
      return NextResponse.json(
        { message: 'Cancelled events cannot be modified.' },
        { status: 400 }
      );
    }

    // 4. parse body
    const body = await request.json();

    // 5. check time validation if start and end time are updated
    const newStartTime = body.startTime !== undefined ? body.startTime : currentEvent.startTime;
    const newEndTime = body.endTime !== undefined ? body.endTime : currentEvent.endTime;
    if (newStartTime >= newEndTime) {
      return NextResponse.json(
        { message: 'Start time must be earlier than end time.' },
        { status: 400 }
      );
    }

    // 6. format tags if provided
    let updatedTags = currentEvent.tags;
    if (body.tags !== undefined) {
      if (Array.isArray(body.tags)) {
        updatedTags = body.tags;
      } else if (typeof body.tags === 'string') {
        updatedTags = body.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0);
      }
    }

    // 7. check if schedule or venue changed on an already Published event
    let newStatus = currentEvent.status;
    const venueOrScheduleChanged =
      (body.venue && body.venue !== currentEvent.venue) ||
      (body.date && body.date !== currentEvent.date) ||
      (body.startTime && body.startTime !== currentEvent.startTime) ||
      (body.endTime && body.endTime !== currentEvent.endTime);

    if (currentEvent.status === 'Published' && venueOrScheduleChanged) {
      // Re-approval is required if venue or timing changes
      newStatus = 'Pending Approval';
    } else if (body.status && body.status !== 'Published') {
      // Organiser can toggle between Draft and Pending Approval
      newStatus = body.status;
    }

    const isPaid = body.isPaid !== undefined ? Boolean(body.isPaid) : currentEvent.isPaid;
    const ticketPrice = isPaid ? Number(body.ticketPrice ?? currentEvent.ticketPrice ?? 0) : 0;

    // 8. update event fields
    const updatedEvent = {
      ...currentEvent,
      title: body.title !== undefined ? body.title.trim() : currentEvent.title,
      description: body.description !== undefined ? body.description.trim() : currentEvent.description,
      poster: body.poster !== undefined ? body.poster.trim() : currentEvent.poster,
      category: body.category !== undefined ? body.category.trim() : currentEvent.category,
      tags: updatedTags,
      date: body.date !== undefined ? body.date.trim() : currentEvent.date,
      startTime: newStartTime.trim(),
      endTime: newEndTime.trim(),
      venue: body.venue !== undefined ? body.venue.trim() : currentEvent.venue,
      capacity: body.capacity !== undefined ? Number(body.capacity) : currentEvent.capacity,
      registrationDeadline: body.registrationDeadline !== undefined ? body.registrationDeadline.trim() : currentEvent.registrationDeadline,
      isPaid: isPaid,
      ticketPrice: ticketPrice,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    events[eventIndex] = updatedEvent;
    saveEvents(events);

    return NextResponse.json(
      {
        message: 'Event updated successfully',
        event: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - cancel or delete an event
export async function DELETE(request, { params }) {
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

    // 2. authorization check: only creator or admin can cancel
    if (event.organiserId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden. You can only cancel your own events.' },
        { status: 403 }
      );
    }

    // 3. mark event status as Cancelled
    event.status = 'Cancelled';
    event.updatedAt = new Date().toISOString();

    saveEvents(events);

    return NextResponse.json(
      {
        message: 'Event cancelled successfully',
        event: event,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to cancel event' },
      { status: 500 }
    );
  }
}
