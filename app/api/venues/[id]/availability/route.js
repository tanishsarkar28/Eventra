import { NextResponse } from 'next/server';
import { readVenues, readBookings, readEvents } from '@/lib/db';

// Helper to calculate free time gaps between booked slots
function calculateAvailableSlots(bookedSlots, venueStart = '08:00', venueEnd = '20:00') {
  if (!bookedSlots || bookedSlots.length === 0) {
    return [{ startTime: venueStart, endTime: venueEnd }];
  }

  // Sort slots by start time
  const sorted = [...bookedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Merge overlapping or adjacent booked slots
  const mergedBookings = [];
  let cur = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (next.startTime <= cur.endTime) {
      if (next.endTime > cur.endTime) {
        cur.endTime = next.endTime;
      }
    } else {
      mergedBookings.push(cur);
      cur = { ...next };
    }
  }
  mergedBookings.push(cur);

  // Find free gaps between venueStart and venueEnd
  const freeSlots = [];
  let cursor = venueStart;

  for (const b of mergedBookings) {
    // If booking starts after current cursor, there's a free slot
    if (b.startTime > cursor) {
      const slotStart = cursor;
      const slotEnd = b.startTime < venueEnd ? b.startTime : venueEnd;
      if (slotStart < slotEnd) {
        freeSlots.push({ startTime: slotStart, endTime: slotEnd });
      }
    }
    if (b.endTime > cursor) {
      cursor = b.endTime;
    }
  }

  // Trailing free slot after last booking
  if (cursor < venueEnd) {
    freeSlots.push({ startTime: cursor, endTime: venueEnd });
  }

  return freeSlots;
}

// ==================== GET /api/venues/:id/availability ====================
// Check venue availability for a selected date and optional time range.
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const reqStartTime = searchParams.get('startTime');
    const reqEndTime = searchParams.get('endTime');

    // 1. Validate date query parameter
    if (!date) {
      return NextResponse.json(
        { message: 'Date query parameter is required (format: YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    const dateObj = new Date(date + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { message: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // 2. Find venue
    const venues = readVenues();
    const venue = venues.find(v => v.id === id);

    if (!venue || venue.isActive === false) {
      return NextResponse.json(
        { message: 'Venue not found or inactive.' },
        { status: 404 }
      );
    }

    // 3. Day of week check
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const isDayAvailable = !venue.availableDays || venue.availableDays.includes(dayOfWeek);

    if (!isDayAvailable) {
      return NextResponse.json({
        venue: { id: venue.id, name: venue.name, capacity: venue.capacity, location: venue.location },
        date,
        dayOfWeek,
        isAvailable: false,
        isSlotAvailable: false,
        reason: `Venue '${venue.name}' is closed on ${dayOfWeek}s.`,
        blackout: null,
        bookedSlots: [],
        availableSlots: [],
        availableFrom: venue.availableFrom || '08:00',
        availableTo: venue.availableTo || '20:00',
      }, { status: 200 });
    }

    // 4. Check for blackout on this date
    const allBookings = readBookings();
    const blackout = allBookings.find(
      b => b.venueId === id && b.type === 'blackout' && b.date === date
    );

    if (blackout) {
      return NextResponse.json({
        venue: { id: venue.id, name: venue.name, capacity: venue.capacity, location: venue.location },
        date,
        dayOfWeek,
        isAvailable: false,
        isSlotAvailable: false,
        reason: `Venue is blocked on ${date} due to: ${blackout.reason || blackout.title}`,
        blackout: {
          reason: blackout.reason || blackout.title,
          note: blackout.note || '',
        },
        bookedSlots: [
          {
            startTime: venue.availableFrom || '08:00',
            endTime: venue.availableTo || '20:00',
            title: `Blackout: ${blackout.reason || blackout.title}`,
            type: 'blackout',
          },
        ],
        availableSlots: [],
        availableFrom: venue.availableFrom || '08:00',
        availableTo: venue.availableTo || '20:00',
      }, { status: 200 });
    }

    // 5. Gather booked slots from approved/confirmed bookings
    const confirmedBookings = allBookings.filter(
      b => b.venueId === id &&
        b.type === 'booking' &&
        b.date === date &&
        (b.status === 'Approved' || b.status === 'Confirmed')
    );

    // 6. Gather booked slots from published events at this venue
    const allEvents = readEvents();
    const publishedEvents = allEvents.filter(
      e => e.status === 'Published' &&
        e.date === date &&
        e.venue &&
        e.venue.trim().toLowerCase() === venue.name.trim().toLowerCase()
    );

    // 7. Combine bookings and events without duplicate eventIds
    const bookedSlots = [];
    const recordedEventIds = new Set();

    for (const b of confirmedBookings) {
      bookedSlots.push({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        title: b.title,
        type: 'booking',
        requestedByName: b.requestedByName || '',
      });
      if (b.eventId) recordedEventIds.add(b.eventId);
    }

    for (const ev of publishedEvents) {
      if (!recordedEventIds.has(ev.id)) {
        bookedSlots.push({
          id: ev.id,
          startTime: ev.startTime || venue.availableFrom,
          endTime: ev.endTime || venue.availableTo,
          title: ev.title,
          type: 'event',
          requestedByName: ev.organiserName || ev.clubName || '',
        });
      }
    }

    // Sort booked slots
    bookedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // 8. Calculate free time slots
    const availableSlots = calculateAvailableSlots(
      bookedSlots,
      venue.availableFrom || '08:00',
      venue.availableTo || '20:00'
    );

    // 9. If a specific time range was queried, check if it conflicts
    let isSlotAvailable = null;
    let slotConflictReason = null;

    if (reqStartTime && reqEndTime) {
      if (reqStartTime >= reqEndTime) {
        isSlotAvailable = false;
        slotConflictReason = 'Requested start time must be earlier than end time.';
      } else if (reqStartTime < (venue.availableFrom || '08:00')) {
        isSlotAvailable = false;
        slotConflictReason = `Requested start time ${reqStartTime} is before venue opening at ${venue.availableFrom}.`;
      } else if (reqEndTime > (venue.availableTo || '20:00')) {
        isSlotAvailable = false;
        slotConflictReason = `Requested end time ${reqEndTime} is after venue closing at ${venue.availableTo}.`;
      } else {
        // Check overlap with any booked slot
        const conflict = bookedSlots.find(
          slot => reqStartTime < slot.endTime && reqEndTime > slot.startTime
        );
        if (conflict) {
          isSlotAvailable = false;
          slotConflictReason = `Time conflicts with existing booking/event: "${conflict.title}" (${conflict.startTime} - ${conflict.endTime}).`;
        } else {
          isSlotAvailable = true;
        }
      }
    }

    return NextResponse.json({
      venue: {
        id: venue.id,
        name: venue.name,
        type: venue.type,
        capacity: venue.capacity,
        location: venue.location,
        facilities: venue.facilities || [],
      },
      date,
      dayOfWeek,
      isAvailable: availableSlots.length > 0,
      isSlotAvailable,
      slotConflictReason,
      blackout: null,
      bookedSlots,
      availableSlots,
      availableFrom: venue.availableFrom || '08:00',
      availableTo: venue.availableTo || '20:00',
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking venue availability:', error);
    return NextResponse.json(
      { message: 'Internal server error while checking availability' },
      { status: 500 }
    );
  }
}
