import { NextResponse } from 'next/server';
import { readEvents } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';
import { validateVenueAndTime } from '@/lib/venueValidation';

/**
 * GET /api/admin/pending-events (and /admin/pending-events via dual-path middleware)
 * 
 * Lists all events awaiting administrative approval.
 * Pre-computes Module 4 clash validation for each pending event so administrators
 * immediately see whether an event is conflict-free or requires an override.
 */
export async function GET(request) {
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

    const allEvents = readEvents();
    const pending = allEvents.filter((e) => e.status === 'Pending Approval');

    // Pre-evaluate clash validation for each pending event
    const enrichedPendingEvents = pending.map((event) => {
      const validation = validateVenueAndTime(event, allEvents, {
        adminOverride: false,
      });

      return {
        ...event,
        hasClashes: !validation.isValid,
        clashCount: validation.clashes ? validation.clashes.length : 0,
        clashes: validation.clashes || [],
        canOverride: true,
      };
    });

    return NextResponse.json(
      {
        success: true,
        count: enrichedPendingEvents.length,
        events: enrichedPendingEvents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /admin/pending-events GET] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pending events.' },
      { status: 500 }
    );
  }
}
