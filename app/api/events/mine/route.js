import { NextResponse } from 'next/server';
import { readEvents } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

// GET /api/events/mine - get events created by logged-in organiser
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

    // 5. return list of organiser's events
    return NextResponse.json(
      { events: myEvents },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch organiser events' },
      { status: 500 }
    );
  }
}
