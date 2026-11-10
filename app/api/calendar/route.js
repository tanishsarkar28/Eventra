import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import {
  getStudentSchedule,
  calculateFreeSlots,
  getDayOfWeekFromDate,
  DAYS_OF_WEEK,
} from '@/lib/personalSchedule';

/**
 * GET /api/calendar (and /calendar via middleware rewrite)
 * 
 * Returns the student's complete personal schedule:
 * 1. Timetable slots (recurring weekly classes)
 * 2. Registered events
 * 3. Bookmarked events
 * 4. Weekly agenda grouped by day of week
 * 5. Free slots for any requested date (?date=YYYY-MM-DD)
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
    const { searchParams } = new URL(request.url);
    const queryDate = searchParams.get('date');

    // Build weekly agenda (Monday through Sunday)
    const weeklyAgenda = {};
    for (const day of DAYS_OF_WEEK) {
      weeklyAgenda[day] = [];
    }

    // Place recurring timetable slots into weekly agenda
    for (const slot of schedule.timetable) {
      const day = slot.dayOfWeek;
      if (weeklyAgenda[day]) {
        weeklyAgenda[day].push({
          type: 'class',
          id: slot.id,
          title: slot.subject,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: slot.room,
          instructor: slot.instructor,
        });
      }
    }

    // Place registered events into weekly agenda
    for (const ev of schedule.registeredEvents) {
      const day = getDayOfWeekFromDate(ev.date);
      if (weeklyAgenda[day]) {
        weeklyAgenda[day].push({
          type: 'event',
          id: ev.id,
          title: ev.title,
          date: ev.date,
          startTime: ev.startTime,
          endTime: ev.endTime,
          venue: ev.venue,
          status: 'Confirmed',
        });
      }
    }

    // Sort agenda items by startTime
    for (const day of Object.keys(weeklyAgenda)) {
      weeklyAgenda[day].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }

    // Calculate free slots for a specific date if provided
    let freeSlots = [];
    if (queryDate) {
      const dayName = getDayOfWeekFromDate(queryDate);
      const busyList = [];

      // Add timetable lectures for that day
      for (const slot of schedule.timetable) {
        if ((slot.dayOfWeek || '').toLowerCase() === dayName.toLowerCase()) {
          busyList.push({
            title: slot.subject,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      }

      // Add registered events on that exact date
      for (const ev of schedule.registeredEvents) {
        if (ev.date === queryDate) {
          busyList.push({
            title: ev.title,
            startTime: ev.startTime,
            endTime: ev.endTime,
          });
        }
      }

      freeSlots = calculateFreeSlots(busyList, '08:00', '18:00');
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      schedule,
      weeklyAgenda,
      freeSlots,
    });
  } catch (error) {
    console.error('Calendar GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error fetching calendar.' },
      { status: 500 }
    );
  }
}
