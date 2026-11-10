import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { readEvents } from '@/lib/db';
import { checkPersonalScheduleClash } from '@/lib/personalSchedule';

/**
 * GET /api/calendar/clashes (and /calendar/clashes via middleware rewrite)
 * 
 * Checks if an event clashes with the logged-in student's schedule:
 * 1. Clashes with class timetable slots (e.g. DBMS lecture)
 * 2. Clashes with already registered events
 * 
 * Supports:
 * - ?eventId=... (look up event details from database)
 * - ?date=...&startTime=...&endTime=...&title=... (check custom time slot)
 */
export async function GET(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const queryDate = searchParams.get('date');
    const queryStartTime = searchParams.get('startTime');
    const queryEndTime = searchParams.get('endTime');
    const queryTitle = searchParams.get('title') || 'Target Event';

    let targetEvent = null;

    if (eventId) {
      const allEvents = readEvents();
      targetEvent = allEvents.find((e) => e.id === eventId);
      if (!targetEvent) {
        return NextResponse.json(
          { success: false, error: 'Event not found.' },
          { status: 404 }
        );
      }
    } else if (queryDate && queryStartTime && queryEndTime) {
      targetEvent = {
        id: 'temp_event',
        title: queryTitle,
        date: queryDate,
        startTime: queryStartTime,
        endTime: queryEndTime,
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide either ?eventId=... or (?date=...&startTime=...&endTime=...)',
        },
        { status: 400 }
      );
    }

    const clashResult = checkPersonalScheduleClash(user.id, targetEvent);

    return NextResponse.json({
      success: true,
      targetEvent: {
        id: targetEvent.id,
        title: targetEvent.title,
        date: targetEvent.date,
        startTime: targetEvent.startTime,
        endTime: targetEvent.endTime,
      },
      hasClash: clashResult.hasClash,
      type: clashResult.type,
      message: clashResult.message || 'No clashes detected with your schedule!',
      conflictingItem: clashResult.conflictingItem,
    });
  } catch (error) {
    console.error('Clashes check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error checking clashes.' },
      { status: 500 }
    );
  }
}
