import { readRegistrations, readEvents, readTimetable, readBookmarks } from './db.js';

/**
 * Days of the week lookup table (0 = Sunday, 1 = Monday, ...)
 */
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * 1. Helper: Convert a date string (YYYY-MM-DD) into its day name (e.g. "Thursday")
 */
export function getDayOfWeekFromDate(dateStr) {
  if (!dateStr) return '';
  // Append T00:00:00 to avoid UTC timezone shifting the date backwards
  const dateObj = new Date(dateStr + 'T00:00:00');
  if (isNaN(dateObj.getTime())) return '';
  return DAYS_OF_WEEK[dateObj.getDay()];
}

/**
 * 2. Helper: Check if two time intervals overlap (Golden Rule)
 * Overlap occurs if and only if: (startA < endB) && (endA > startB)
 * Example:
 * A: 10:00 - 11:30, B: 11:00 - 12:00 -> 10:00 < 12:00 && 11:30 > 11:00 -> TRUE
 */
export function doIntervalsOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false;
  return startA < endB && endA > startB;
}

/**
 * 3. Module 8 Core: Personal Schedule Clash Detection
 * 
 * Checks if a target event clashes with:
 * A) The student's recurring class timetable (e.g. "DBMS lecture")
 * B) Any other event the student is already registered for
 * 
 * @param {string} userId - ID of the student
 * @param {object} targetEvent - { id, date, startTime, endTime, title }
 * @returns {{ hasClash: boolean, type: 'timetable' | 'event' | null, conflictingItem: object | null, conflictingEvent: object | null, conflictingSlot: object | null, message: string }}
 */
export function checkPersonalScheduleClash(userId, targetEvent) {
  if (!userId || !targetEvent || !targetEvent.date || !targetEvent.startTime || !targetEvent.endTime) {
    return {
      hasClash: false,
      type: null,
      conflictingItem: null,
      conflictingEvent: null,
      conflictingSlot: null,
      message: '',
    };
  }

  // --- Check A: Timetable Slots (Lectures / Labs) ---
  const eventDay = getDayOfWeekFromDate(targetEvent.date);
  const allTimetableSlots = readTimetable();
  const userTimetableSlots = allTimetableSlots.filter((slot) => {
    if (slot.userId !== userId) return false;
    // Match day of week case-insensitively (e.g. "Thursday" or "thu")
    const slotDay = (slot.dayOfWeek || '').toLowerCase();
    const targetDay = (eventDay || '').toLowerCase();
    return slotDay === targetDay || slotDay.startsWith(targetDay.substring(0, 3));
  });

  for (const slot of userTimetableSlots) {
    const hasOverlap = doIntervalsOverlap(
      targetEvent.startTime,
      targetEvent.endTime,
      slot.startTime,
      slot.endTime
    );

    if (hasOverlap) {
      const roomInfo = slot.room ? ` (Room: ${slot.room})` : '';
      const subjectDesc = /lecture|lab|class|session/i.test(slot.subject)
        ? slot.subject
        : `${slot.subject} lecture`;

      return {
        hasClash: true,
        type: 'timetable',
        conflictingItem: slot,
        conflictingSlot: slot,
        conflictingEvent: null,
        message: `Personal Clash: This event overlaps your ${subjectDesc} on ${slot.dayOfWeek} from ${slot.startTime} to ${slot.endTime}${roomInfo}.`,
      };
    }
  }

  // --- Check B: Other Registered Events ---
  const registrations = readRegistrations();
  const confirmedUserRegistrations = registrations.filter(
    (reg) => reg.userId === userId && reg.status === 'Confirmed' && reg.eventId !== targetEvent.id
  );

  if (confirmedUserRegistrations.length > 0) {
    const allEvents = readEvents();
    const registeredEventIds = new Set(confirmedUserRegistrations.map((r) => r.eventId));
    const userRegisteredEvents = allEvents.filter(
      (e) => registeredEventIds.has(e.id) && e.status === 'Published'
    );

    for (const regEvent of userRegisteredEvents) {
      if (regEvent.date === targetEvent.date) {
        const hasOverlap = doIntervalsOverlap(
          targetEvent.startTime,
          targetEvent.endTime,
          regEvent.startTime,
          regEvent.endTime
        );

        if (hasOverlap) {
          return {
            hasClash: true,
            type: 'event',
            conflictingItem: regEvent,
            conflictingEvent: regEvent,
            conflictingSlot: null,
            message: `Personal Clash: You are already registered for '${regEvent.title}' on ${targetEvent.date} from ${regEvent.startTime} to ${regEvent.endTime}.`,
          };
        }
      }
    }
  }

  return {
    hasClash: false,
    type: null,
    conflictingItem: null,
    conflictingEvent: null,
    conflictingSlot: null,
    message: '',
  };
}

/**
 * 4. Helper: Get full personal schedule for a student
 * Combines timetable slots, registered events, and bookmarked events.
 */
export function getStudentSchedule(userId) {
  if (!userId) {
    return { timetable: [], registeredEvents: [], bookmarkedEvents: [] };
  }

  // A. Class Timetable
  const allSlots = readTimetable();
  const userSlots = allSlots.filter((s) => s.userId === userId);

  // B. Registered Events
  const allRegistrations = readRegistrations();
  const userRegistrations = allRegistrations.filter(
    (r) => r.userId === userId && r.status === 'Confirmed'
  );
  const registeredIds = new Set(userRegistrations.map((r) => r.eventId));

  // C. Bookmarked Events
  const allBookmarks = readBookmarks();
  const userBookmarks = allBookmarks.filter((b) => b.userId === userId);
  const bookmarkedIds = new Set(userBookmarks.map((b) => b.eventId));

  // D. Event details
  const allEvents = readEvents();
  const registeredEvents = allEvents.filter((e) => registeredIds.has(e.id));
  const bookmarkedEvents = allEvents.filter(
    (e) => bookmarkedIds.has(e.id) && !registeredIds.has(e.id)
  );

  return {
    timetable: userSlots,
    registeredEvents,
    bookmarkedEvents,
  };
}

/**
 * 5. Helper: Calculate free slots for a student on a specific date / day
 * @param {Array<{ startTime: string, endTime: string, title: string }>} busyIntervals
 * @param {string} dayStart - e.g. "08:00"
 * @param {string} dayEnd - e.g. "18:00"
 * @returns {Array<{ startTime: string, endTime: string, durationMinutes: number }>}
 */
export function calculateFreeSlots(busyIntervals = [], dayStart = '08:00', dayEnd = '18:00') {
  if (!busyIntervals || busyIntervals.length === 0) {
    return [
      {
        startTime: dayStart,
        endTime: dayEnd,
        durationMinutes: calculateDurationMinutes(dayStart, dayEnd),
      },
    ];
  }

  // 1. Sort busy intervals by startTime
  const sorted = [...busyIntervals].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // 2. Merge overlapping busy intervals
  const mergedBusy = [];
  for (const interval of sorted) {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ ...interval });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (interval.startTime <= last.endTime) {
        // Overlap or touch -> extend endTime
        if (interval.endTime > last.endTime) {
          last.endTime = interval.endTime;
        }
      } else {
        mergedBusy.push({ ...interval });
      }
    }
  }

  // 3. Find gaps between dayStart and dayEnd
  const freeSlots = [];
  let currentTime = dayStart;

  for (const busy of mergedBusy) {
    // If there is a gap before this busy block
    if (currentTime < busy.startTime && currentTime < dayEnd) {
      const freeEnd = busy.startTime < dayEnd ? busy.startTime : dayEnd;
      if (currentTime < freeEnd) {
        freeSlots.push({
          startTime: currentTime,
          endTime: freeEnd,
          durationMinutes: calculateDurationMinutes(currentTime, freeEnd),
        });
      }
    }
    // Advance currentTime past this busy block
    if (busy.endTime > currentTime) {
      currentTime = busy.endTime;
    }
  }

  // If there's still time left before the day ends
  if (currentTime < dayEnd) {
    freeSlots.push({
      startTime: currentTime,
      endTime: dayEnd,
      durationMinutes: calculateDurationMinutes(currentTime, dayEnd),
    });
  }

  return freeSlots;
}

/**
 * Helper: Duration in minutes between two "HH:MM" times
 */
function calculateDurationMinutes(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/**
 * 6. Helper: Generate standard .ics (iCalendar) content
 * Compatible with Google Calendar, Apple Calendar, and Microsoft Outlook.
 */
export function generateIcsCalendar({ user, events = [], timetableSlots = [] }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventra//Campus Event Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Eventra Schedule - ${user?.name || 'Student'}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  // Helper to format Date and Time to iCal format: YYYYMMDDTHHmmss
  const formatIcsDateTime = (dateStr, timeStr) => {
    const cleanDate = (dateStr || '').replace(/-/g, '');
    const cleanTime = (timeStr || '').replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  };

  // Add Registered / Bookmarked Events
  for (const event of events) {
    const dtStart = formatIcsDateTime(event.date, event.startTime || '09:00');
    const dtEnd = formatIcsDateTime(event.date, event.endTime || '10:00');
    const uid = `event-${event.id}-${event.date}@eventra.campus`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`SUMMARY:${event.title || 'Campus Event'}`);
    if (event.description) {
      // Escape special characters for iCal
      const cleanDesc = event.description.replace(/(\r\n|\n|\r)/gm, ' ');
      lines.push(`DESCRIPTION:${cleanDesc}`);
    }
    if (event.venue) {
      lines.push(`LOCATION:${event.venue}`);
    }
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`STATUS:CONFIRMED`);
    lines.push('END:VEVENT');
  }

  // Add recurring Timetable slots (Weekly recurring rule RRULE:FREQ=WEEKLY)
  const dayCodeMap = {
    Sunday: 'SU',
    Monday: 'MO',
    Tuesday: 'TU',
    Wednesday: 'WE',
    Thursday: 'TH',
    Friday: 'FR',
    Saturday: 'SA',
  };

  // Pick a base date (e.g. today's week) for the recurrence start
  const today = new Date();
  for (const slot of timetableSlots) {
    const dayCode = dayCodeMap[slot.dayOfWeek] || 'MO';
    const dayIndex = DAYS_OF_WEEK.indexOf(slot.dayOfWeek);

    // Calculate next occurrence of this day of week
    const currentDayIndex = today.getDay();
    let diff = (dayIndex >= 0 ? dayIndex : 1) - currentDayIndex;
    if (diff < 0) diff += 7;

    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + diff);
    const dateStr = baseDate.toISOString().split('T')[0];

    const dtStart = formatIcsDateTime(dateStr, slot.startTime || '10:00');
    const dtEnd = formatIcsDateTime(dateStr, slot.endTime || '11:00');
    const uid = `timetable-${slot.id}@eventra.campus`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`SUMMARY:Class: ${slot.subject || 'Lecture'}`);
    lines.push(
      `DESCRIPTION:Class lecture${slot.instructor ? ` by ${slot.instructor}` : ''}${slot.room ? ` in Room ${slot.room}` : ''}`
    );
    if (slot.room) {
      lines.push(`LOCATION:${slot.room}`);
    }
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
