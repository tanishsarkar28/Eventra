import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { readTimetable, saveTimetable } from '@/lib/db';
import { DAYS_OF_WEEK } from '@/lib/personalSchedule';

/**
 * GET /api/calendar/timetable
 * Fetch all timetable slots for the logged-in student.
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

    const allSlots = readTimetable();
    const userSlots = allSlots.filter((s) => s.userId === user.id);

    return NextResponse.json({
      success: true,
      timetable: userSlots,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timetable.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/timetable
 * 
 * Add class timetable slot(s). Supports:
 * 1. Single slot: { subject, dayOfWeek, startTime, endTime, room, instructor }
 * 2. Bulk slots: { slots: [ { subject, dayOfWeek, startTime, endTime, room, instructor }, ... ] }
 */
export async function POST(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const allSlots = readTimetable();

    // Check if body contains multiple slots (bulk import)
    const incomingSlots = Array.isArray(body.slots) ? body.slots : [body];

    const addedSlots = [];
    const errors = [];

    for (let i = 0; i < incomingSlots.length; i++) {
      const item = incomingSlots[i];
      const subject = (item.subject || '').trim();
      let dayOfWeek = (item.dayOfWeek || '').trim();
      const startTime = (item.startTime || '').trim();
      const endTime = (item.endTime || '').trim();
      const room = (item.room || '').trim();
      const instructor = (item.instructor || '').trim();

      // Normalize day name (e.g. "monday" -> "Monday")
      const matchedDay = DAYS_OF_WEEK.find(
        (d) => d.toLowerCase() === dayOfWeek.toLowerCase() || d.toLowerCase().startsWith(dayOfWeek.toLowerCase().substring(0, 3))
      );
      if (matchedDay) {
        dayOfWeek = matchedDay;
      }

      // Validations
      if (!subject) {
        errors.push(`Slot #${i + 1}: Subject name is required.`);
        continue;
      }
      if (!dayOfWeek || !DAYS_OF_WEEK.includes(dayOfWeek)) {
        errors.push(`Slot #${i + 1}: Invalid day of week ('${item.dayOfWeek}'). Use Monday-Sunday.`);
        continue;
      }
      if (!startTime || !endTime) {
        errors.push(`Slot #${i + 1}: Both startTime and endTime are required.`);
        continue;
      }
      if (startTime >= endTime) {
        errors.push(`Slot #${i + 1}: startTime (${startTime}) must be earlier than endTime (${endTime}).`);
        continue;
      }

      const newSlot = {
        id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        subject,
        dayOfWeek,
        startTime,
        endTime,
        room: room || 'Classroom',
        instructor: instructor || '',
        createdAt: new Date().toISOString(),
      };

      allSlots.push(newSlot);
      addedSlots.push(newSlot);
    }

    if (addedSlots.length === 0) {
      return NextResponse.json(
        { success: false, error: errors.join(' ') || 'No valid timetable slots to add.' },
        { status: 400 }
      );
    }

    saveTimetable(allSlots);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully added ${addedSlots.length} timetable slot(s).`,
        addedSlots,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/calendar/timetable error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error adding timetable slot.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/timetable?id=slot_...
 * Remove a timetable slot.
 */
export async function DELETE(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing timetable slot ID.' },
        { status: 400 }
      );
    }

    const allSlots = readTimetable();
    const slotIndex = allSlots.findIndex((s) => s.id === id && s.userId === user.id);

    if (slotIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Timetable slot not found or not owned by you.' },
        { status: 404 }
      );
    }

    const removed = allSlots.splice(slotIndex, 1)[0];
    saveTimetable(allSlots);

    return NextResponse.json({
      success: true,
      message: `Removed slot: ${removed.subject} (${removed.dayOfWeek} ${removed.startTime}-${removed.endTime})`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error deleting timetable slot.' },
      { status: 500 }
    );
  }
}
