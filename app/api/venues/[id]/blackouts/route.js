import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { readVenues, readBookings, saveBookings } from '@/lib/db';

// ==================== GET /api/venues/:id/blackouts ====================
// List all blackout periods for a venue.
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const bookings = readBookings();
    const blackouts = bookings.filter(b => b.venueId === id && b.type === 'blackout');

    return NextResponse.json({ blackouts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching blackouts:', error);
    return NextResponse.json(
      { message: 'Internal server error while fetching blackouts' },
      { status: 500 }
    );
  }
}

// ==================== POST /api/venues/:id/blackouts ====================
// Block a venue on specific dates (Admin only).
export async function POST(request, { params }) {
  try {
    // 1. Authenticate user and verify admin role
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden. Admin access required to block venues.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { date, reason, note, startDate, endDate } = body;

    // 2. Validate reason
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { message: 'Blackout reason is required (e.g. Exams, Maintenance, Holiday).' },
        { status: 400 }
      );
    }

    // 3. Find venue
    const venues = readVenues();
    const venue = venues.find(v => v.id === id);
    if (!venue) {
      return NextResponse.json(
        { message: 'Venue not found' },
        { status: 404 }
      );
    }

    // 4. Determine list of dates to block
    const datesToBlock = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return NextResponse.json(
          { message: 'Invalid start or end date range.' },
          { status: 400 }
        );
      }
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        datesToBlock.push(d.toISOString().split('T')[0]);
      }
    } else if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { message: 'Invalid date format. Expected YYYY-MM-DD.' },
          { status: 400 }
        );
      }
      datesToBlock.push(date.trim());
    } else {
      return NextResponse.json(
        { message: 'Date or date range (startDate, endDate) is required.' },
        { status: 400 }
      );
    }

    const bookings = readBookings();
    const createdBlackouts = [];

    // 5. Add blackout for each date, avoiding exact duplicates
    for (const d of datesToBlock) {
      const existing = bookings.find(
        b => b.venueId === id && b.type === 'blackout' && b.date === d
      );
      if (!existing) {
        const blackoutEntry = {
          id: (Date.now() + Math.floor(Math.random() * 1000)).toString(),
          venueId: id,
          venueName: venue.name,
          type: 'blackout',
          date: d,
          startTime: venue.availableFrom || '08:00',
          endTime: venue.availableTo || '20:00',
          title: `Blackout: ${reason.trim()}`,
          reason: reason.trim(),
          note: note ? note.trim() : '',
          eventId: null,
          requestedBy: user.id,
          requestedByName: user.name,
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        bookings.push(blackoutEntry);
        createdBlackouts.push(blackoutEntry);
      }
    }

    if (createdBlackouts.length === 0) {
      return NextResponse.json(
        { message: 'A blackout already exists for the selected date(s).' },
        { status: 409 }
      );
    }

    saveBookings(bookings);

    return NextResponse.json({
      message: `Venue '${venue.name}' successfully blocked for ${createdBlackouts.length} date(s).`,
      blackout: createdBlackouts[0],
      blackouts: createdBlackouts,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating blackout:', error);
    return NextResponse.json(
      { message: 'Internal server error while creating blackout' },
      { status: 500 }
    );
  }
}

// ==================== DELETE /api/venues/:id/blackouts ====================
// Remove a blackout period (Admin only).
export async function DELETE(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden. Admin access required to remove blackouts.' },
        { status: 403 }
      );
    }

    const { id } = params;
    let blackoutId = null;

    // Read blackoutId from query params or body
    const { searchParams } = new URL(request.url);
    blackoutId = searchParams.get('blackoutId') || searchParams.get('id');

    if (!blackoutId) {
      try {
        const body = await request.json();
        blackoutId = body.blackoutId || body.id;
      } catch (e) {
        // body might be empty
      }
    }

    if (!blackoutId) {
      return NextResponse.json(
        { message: 'blackoutId is required to delete a blackout.' },
        { status: 400 }
      );
    }

    const bookings = readBookings();
    const index = bookings.findIndex(
      b => b.id === blackoutId && b.venueId === id && b.type === 'blackout'
    );

    if (index === -1) {
      return NextResponse.json(
        { message: 'Blackout not found.' },
        { status: 404 }
      );
    }

    const removed = bookings.splice(index, 1)[0];
    saveBookings(bookings);

    return NextResponse.json({
      message: 'Blackout removed successfully.',
      blackout: removed,
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting blackout:', error);
    return NextResponse.json(
      { message: 'Internal server error while removing blackout' },
      { status: 500 }
    );
  }
}
