import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getStudentSchedule, generateIcsCalendar } from '@/lib/personalSchedule';

/**
 * GET /api/calendar/export.ics (and /calendar/export.ics via middleware rewrite)
 * 
 * Exports the student's schedule as an RFC 5545 iCalendar (.ics) file.
 * Compatible with Google Calendar, Apple Calendar, and Outlook.
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

    const schedule = getStudentSchedule(user.id);
    const icsContent = generateIcsCalendar({
      user,
      events: schedule.registeredEvents,
      timetableSlots: schedule.timetable,
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="eventra-calendar.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('ICS Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error exporting calendar.' },
      { status: 500 }
    );
  }
}
