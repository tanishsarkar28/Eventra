import { NextResponse } from 'next/server';
import { readEvents, readRegistrations, readTickets } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

// GET /api/events/mine - get events created by logged-in organiser as well as events they booked tickets for
export async function GET(request) {
  try {
    // 1. check authentication
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
        { message: 'Forbidden. Organiser access required.' },
        { status: 403 }
      );
    }

    // 3. fetch events from database
    const events = readEvents();

    // 4. filter events created by this organiser
    const myEvents = events.filter((e) => e.organiserId === user.id);

    // 5. filter events booked/registered by this organiser
    const registrations = readRegistrations().filter(
      (r) => r.userId === user.id && r.status === 'Confirmed'
    );
    const tickets = readTickets();

    const bookedEvents = registrations.map((reg) => {
      const ev = events.find((e) => e.id === reg.eventId) || {
        id: reg.eventId,
        title: reg.eventTitle,
        category: 'Campus Event',
        date: 'Scheduled',
        venue: 'Campus',
      };
      const ticket = tickets.find(
        (t) => t.registrationId === reg.id || (t.eventId === reg.eventId && t.userId === user.id)
      ) || null;

      return {
        ...ev,
        registrationId: reg.id,
        registeredAt: reg.registeredAt,
        teamSize: reg.teamSize,
        ticket,
      };
    });

    // 6. return both list of organiser's hosted events and their booked tickets
    return NextResponse.json(
      { events: myEvents, bookedEvents },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch organiser events' },
      { status: 500 }
    );
  }
}
