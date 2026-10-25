import { NextResponse } from 'next/server';
import { readEvents, saveEvents } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

// GET /api/events - fetch events
export async function GET(request) {
  try {
    // 1. check if request is coming from browser looking for page
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      return NextResponse.redirect(new URL('/my-events', request.url));
    }

    // 2. read all events
    const events = readEvents();

    // 3. check query parameters (e.g. ?mine=true or ?status=Published)
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine');
    const status = searchParams.get('status');

    if (mine === 'true') {
      const user = await getLoggedInUser(request);
      if (!user) {
        return NextResponse.json(
          { message: 'Unauthorized. Please log in first.' },
          { status: 401 }
        );
      }
      const myEvents = events.filter((e) => e.organiserId === user.id);
      return NextResponse.json({ events: myEvents }, { status: 200 });
    }

    if (status) {
      const filtered = events.filter((e) => e.status === status);
      return NextResponse.json({ events: filtered }, { status: 200 });
    }

    // return all events
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - create a new event
export async function POST(request) {
  try {
    // 1. authenticate user
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    // 2. ensure user is an organiser or admin
    if (user.role !== 'organiser' && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden. Only organisers can create events.' },
        { status: 403 }
      );
    }

    // 3. check if organiser is verified by admin
    if (user.role === 'organiser' && !user.isVerified) {
      return NextResponse.json(
        { message: 'Forbidden. Organiser account must be verified by admin before creating events.' },
        { status: 403 }
      );
    }

    // 4. parse request body
    const body = await request.json();

    // 5. validate required fields
    const {
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      venue,
      capacity,
      registrationDeadline,
    } = body;

    if (!title || !description || !category || !date || !startTime || !endTime || !venue || !capacity || !registrationDeadline) {
      return NextResponse.json(
        { message: 'Please provide all required event details.' },
        { status: 400 }
      );
    }

    if (Number(capacity) <= 0) {
      return NextResponse.json(
        { message: 'Capacity must be greater than 0.' },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { message: 'Start time must be earlier than end time.' },
        { status: 400 }
      );
    }

    // 6. format tags (array or comma-separated string)
    let parsedTags = [];
    if (Array.isArray(body.tags)) {
      parsedTags = body.tags;
    } else if (typeof body.tags === 'string') {
      parsedTags = body.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
    }

    // 7. determine initial status (organisers cannot directly publish)
    let initialStatus = 'Draft';
    if (body.status === 'Pending Approval') {
      initialStatus = 'Pending Approval';
    }

    const isPaid = Boolean(body.isPaid === true || body.isPaid === 'true' || body.freeOrPaid === 'paid');
    const ticketPrice = isPaid ? Number(body.ticketPrice || 0) : 0;

    // 8. build new event object
    const newEvent = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      poster: body.poster ? body.poster.trim() : '',
      category: category.trim(),
      tags: parsedTags,
      date: date.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venue: venue.trim(),
      capacity: Number(capacity),
      registrationDeadline: registrationDeadline.trim(),
      isPaid: isPaid,
      ticketPrice: ticketPrice,
      status: initialStatus,
      organiserId: user.id,
      organiserName: user.name,
      clubName: user.clubName || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 9. save to events.json
    const events = readEvents();
    events.push(newEvent);
    saveEvents(events);

    // 10. return created event
    return NextResponse.json(
      {
        message: 'Event created successfully',
        event: newEvent,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create event' },
      { status: 500 }
    );
  }
}
