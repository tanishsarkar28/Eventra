import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { readVenues, readBookings, saveBookings, readEvents } from '@/lib/db';

// ==================== GET /api/venues/:id/bookings ====================
// List all bookings for a venue. Authenticated users.
export async function GET(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const bookings = readBookings();
    let venueBookings = bookings.filter(
      b => b.venueId === id && b.type === 'booking'
    );

    if (statusFilter) {
      venueBookings = venueBookings.filter(b => b.status === statusFilter);
    }

    // Sort by date, startTime descending
    venueBookings.sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

    return NextResponse.json({ bookings: venueBookings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Internal server error while fetching bookings' },
      { status: 500 }
    );
  }
}

// ==================== POST /api/venues/:id/bookings ====================
// Create a venue booking request.
export async function POST(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { date, startTime, endTime, title, eventId, note } = body;

    // 1. Validate required fields
    if (!date || !startTime || !endTime || !title || !title.trim()) {
      return NextResponse.json(
        { message: 'Date, startTime, endTime, and title are required.' },
        { status: 400 }
      );
    }

    // 2. Validate venue exists and is active
    const venues = readVenues();
    const venue = venues.find(v => v.id === id);

    if (!venue || venue.isActive === false) {
      return NextResponse.json(
        { message: 'Venue not found or inactive.' },
        { status: 404 }
      );
    }

    // 3. Validate date format and day of week
    const dateObj = new Date(date + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { message: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];

    if (venue.availableDays && !venue.availableDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { message: `Venue '${venue.name}' is not open on ${dayOfWeek}s.` },
        { status: 400 }
      );
    }

    // 4. Validate time range
    if (startTime >= endTime) {
      return NextResponse.json(
        { message: 'Start time must be earlier than end time.' },
        { status: 400 }
      );
    }

    const venueFrom = venue.availableFrom || '08:00';
    const venueTo = venue.availableTo || '20:00';

    if (startTime < venueFrom) {
      return NextResponse.json(
        { message: `Venue opens at ${venueFrom}. Selected start time is too early.` },
        { status: 400 }
      );
    }
    if (endTime > venueTo) {
      return NextResponse.json(
        { message: `Venue closes at ${venueTo}. Selected end time is too late.` },
        { status: 400 }
      );
    }

    // 5. Check for blackout on this date
    const bookings = readBookings();
    const blackout = bookings.find(
      b => b.venueId === id && b.type === 'blackout' && b.date === date
    );
    if (blackout) {
      return NextResponse.json(
        { message: `Venue is blocked on ${date} due to: ${blackout.reason || blackout.title}` },
        { status: 400 }
      );
    }

    // 6. Check for time conflict with existing Approved/Confirmed bookings
    const conflictingBooking = bookings.find(
      b => b.venueId === id &&
        b.type === 'booking' &&
        b.date === date &&
        (b.status === 'Approved' || b.status === 'Confirmed') &&
        startTime < b.endTime &&
        endTime > b.startTime
    );

    if (conflictingBooking) {
      return NextResponse.json(
        { message: `Time conflict: Venue is already booked by "${conflictingBooking.title}" from ${conflictingBooking.startTime} to ${conflictingBooking.endTime}.` },
        { status: 409 }
      );
    }

    // 7. Check for time conflict with Published events
    const allEvents = readEvents();
    const conflictingEvent = allEvents.find(
      e => e.status === 'Published' &&
        e.date === date &&
        e.venue &&
        e.venue.trim().toLowerCase() === venue.name.trim().toLowerCase() &&
        startTime < e.endTime &&
        endTime > e.startTime
    );

    if (conflictingEvent) {
      return NextResponse.json(
        { message: `Time conflict: Event "${conflictingEvent.title}" is already scheduled from ${conflictingEvent.startTime} to ${conflictingEvent.endTime}.` },
        { status: 409 }
      );
    }

    // 8. Determine initial status
    const isAdmin = user.role === 'admin';
    const requiresApproval = venue.requiresApproval !== false;
    const initialStatus = (requiresApproval && !isAdmin) ? 'Pending' : 'Approved';

    // 9. Create booking object
    const newBooking = {
      id: Date.now().toString(),
      venueId: id,
      venueName: venue.name,
      type: 'booking',
      date,
      startTime,
      endTime,
      title: title.trim(),
      reason: '',
      note: note ? note.trim() : '',
      eventId: eventId || null,
      requestedBy: user.id,
      requestedByName: user.name,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    saveBookings(bookings);

    return NextResponse.json({
      message: initialStatus === 'Approved'
        ? 'Venue booking confirmed successfully.'
        : 'Venue booking request submitted and is pending administrator approval.',
      booking: newBooking,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { message: 'Internal server error while creating booking' },
      { status: 500 }
    );
  }
}

// ==================== PATCH /api/venues/:id/bookings ====================
// Approve or reject a venue booking (Admin only).
export async function PATCH(request, { params }) {
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
        { message: 'Forbidden. Admin access required to approve or reject bookings.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { bookingId, action, reason } = body;

    if (!bookingId) {
      return NextResponse.json(
        { message: 'bookingId is required.' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { message: 'Action must be either "approve" or "reject".' },
        { status: 400 }
      );
    }

    const bookings = readBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId && b.venueId === id);

    if (bookingIndex === -1) {
      return NextResponse.json(
        { message: 'Booking request not found.' },
        { status: 404 }
      );
    }

    const booking = bookings[bookingIndex];

    // If approving, verify there are no new conflicts
    if (action === 'approve') {
      const conflict = bookings.find(
        b => b.id !== bookingId &&
          b.venueId === id &&
          b.type === 'booking' &&
          b.date === booking.date &&
          (b.status === 'Approved' || b.status === 'Confirmed') &&
          booking.startTime < b.endTime &&
          booking.endTime > b.startTime
      );

      if (conflict) {
        return NextResponse.json(
          { message: `Cannot approve: Conflicts with another approved booking "${conflict.title}" (${conflict.startTime} - ${conflict.endTime}).` },
          { status: 409 }
        );
      }

      booking.status = 'Approved';
    } else {
      booking.status = 'Rejected';
      if (reason) {
        booking.rejectionReason = reason;
      }
    }

    booking.updatedAt = new Date().toISOString();
    bookings[bookingIndex] = booking;
    saveBookings(bookings);

    return NextResponse.json({
      message: `Booking has been ${booking.status.toLowerCase()} successfully.`,
      booking,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { message: 'Internal server error while updating booking' },
      { status: 500 }
    );
  }
}
