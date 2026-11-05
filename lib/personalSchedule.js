import { readRegistrations, readEvents } from './db.js';

/**
 * Module 8 Integration: Personal Schedule Clash Detection
 * 
 * Purpose:
 * Prevents a student from double-booking themselves by registering for two
 * events that overlap in time on the same date.
 * 
 * Golden Interval Overlap Rule:
 * Overlap occurs if and only if:
 * (targetEvent.startTime < registeredEvent.endTime) && (targetEvent.endTime > registeredEvent.startTime)
 * 
 * @param {string} userId - ID of the student attempting to register
 * @param {object} targetEvent - The event object the student wants to register for
 * @returns {{ hasClash: boolean, conflictingEvent: object | null, message: string }}
 */
export function checkPersonalScheduleClash(userId, targetEvent) {
  if (!userId || !targetEvent || !targetEvent.date || !targetEvent.startTime || !targetEvent.endTime) {
    return { hasClash: false, conflictingEvent: null, message: '' };
  }

  // 1. Get all registrations for this user
  const registrations = readRegistrations();
  const confirmedUserRegistrations = registrations.filter(
    (reg) => reg.userId === userId && reg.status === 'Confirmed' && reg.eventId !== targetEvent.id
  );

  if (confirmedUserRegistrations.length === 0) {
    return { hasClash: false, conflictingEvent: null, message: '' };
  }

  // 2. Fetch all events to inspect the date and timings of previously confirmed registrations
  const allEvents = readEvents();
  const registeredEventIds = new Set(confirmedUserRegistrations.map((r) => r.eventId));
  const userRegisteredEvents = allEvents.filter(
    (e) => registeredEventIds.has(e.id) && e.status === 'Published'
  );

  // 3. Scan each registered event for scheduling conflict on the same date
  for (const regEvent of userRegisteredEvents) {
    if (regEvent.date === targetEvent.date) {
      // Golden Interval Overlap check
      const hasOverlap = (targetEvent.startTime < regEvent.endTime) && (targetEvent.endTime > regEvent.startTime);

      if (hasOverlap) {
        return {
          hasClash: true,
          conflictingEvent: regEvent,
          message: `Module 8 Personal Schedule Clash: You are already registered for '${regEvent.title}' on ${targetEvent.date} from ${regEvent.startTime} to ${regEvent.endTime}.`,
        };
      }
    }
  }

  return { hasClash: false, conflictingEvent: null, message: '' };
}
