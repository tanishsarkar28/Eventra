/**
 * ============================================================================
 * Module 3 & 4 Integration - Venue and Time Validation
 * ============================================================================
 * 
 * This module coordinates baseline event checks (required venue, valid dates,
 * start < end, deadline check, venue operational status) AND runs the full
 * Module 4 Clash Engine (venue clash, capacity clash, organiser clash,
 * audience clash, blackout clash).
 * 
 * Supports Administrator Override when emergency or official approval is granted.
 */

import { readVenues, readBookings } from '@/lib/db';
import { detectClashes } from '@/lib/clashEngine';

export function validateVenueAndTime(eventToValidate, allEvents = [], options = {}) {
  // 1. check if venue is provided
  if (!eventToValidate.venue || eventToValidate.venue.trim().length === 0) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Event venue is required.',
      clashes: [],
    };
  }

  // 2. check if event date is provided and formatted
  if (!eventToValidate.date) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Event date is required.',
      clashes: [],
    };
  }

  // 3. check if event date is valid (cannot be invalid date format)
  const eventDate = new Date(eventToValidate.date);
  if (isNaN(eventDate.getTime())) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Invalid event date format.',
      clashes: [],
    };
  }

  // 4. check if start time and end time are provided
  if (!eventToValidate.startTime || !eventToValidate.endTime) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Both start time and end time are required.',
      clashes: [],
    };
  }

  // 5. check that start time is strictly before end time
  if (eventToValidate.startTime >= eventToValidate.endTime) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Start time must be earlier than end time.',
      clashes: [],
    };
  }

  // 6. check registration deadline is on or before event date
  if (eventToValidate.registrationDeadline) {
    const deadlineDate = new Date(eventToValidate.registrationDeadline);
    if (!isNaN(deadlineDate.getTime()) && deadlineDate > eventDate) {
      return {
        isValid: false,
        message: 'Module 3 Validation Error: Registration deadline cannot be after the event date.',
        clashes: [],
      };
    }
  }

  // 7. Check if venue exists and is active
  const venues = readVenues();
  const cleanVenue = eventToValidate.venue.trim().toLowerCase();

  const inactiveVenue = venues.find(
    (v) => v.name.trim().toLowerCase() === cleanVenue && v.isActive === false
  );
  if (inactiveVenue) {
    return {
      isValid: false,
      message: `Module 4 Validation Error: Venue '${inactiveVenue.name}' is currently inactive or decommissioned.`,
      clashes: [],
    };
  }

  const matchedVenue = venues.find(
    (v) => v.name.trim().toLowerCase() === cleanVenue && v.isActive !== false
  );

  if (matchedVenue) {
    // 7a. check if the event day is in venue's available days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const eventDayOfWeek = dayNames[eventDate.getDay()];

    if (matchedVenue.availableDays && !matchedVenue.availableDays.includes(eventDayOfWeek)) {
      return {
        isValid: false,
        message: `Module 4 Validation Error: Venue '${matchedVenue.name}' is not available on ${eventDayOfWeek}s.`,
        clashes: [],
      };
    }

    // 7b. check if event time falls within venue's available hours
    if (matchedVenue.availableFrom && eventToValidate.startTime < matchedVenue.availableFrom) {
      return {
        isValid: false,
        message: `Module 4 Validation Error: Venue '${matchedVenue.name}' opens at ${matchedVenue.availableFrom}. Event starts too early.`,
        clashes: [],
      };
    }
    if (matchedVenue.availableTo && eventToValidate.endTime > matchedVenue.availableTo) {
      return {
        isValid: false,
        message: `Module 4 Validation Error: Venue '${matchedVenue.name}' closes at ${matchedVenue.availableTo}. Event ends too late.`,
        clashes: [],
      };
    }
  }

  // 8. Run Full Module 4 Clash Detection Engine
  const bookings = readBookings();
  const clashResult = detectClashes(eventToValidate, {
    allEvents,
    allVenues: venues,
    allBookings: bookings,
  });

  // 9. Admin Override Check:
  // If an administrator provided an explicit override reason, allow publishing
  if (options.adminOverride === true && options.overrideReason && options.overrideReason.trim().length > 0) {
    return {
      isValid: true,
      message: `Module 4 Warning Overridden: Event published with Administrator Override: "${options.overrideReason}".`,
      isOverridden: true,
      overrideReason: options.overrideReason,
      clashes: clashResult.clashes,
      clashCount: clashResult.clashCount,
    };
  }

  // 10. Check for blocking clashes:
  // Critical clashes (Venue clash, Blackout clash) strictly block publication.
  // If options.strict is true, any clash blocks publication.
  const criticalClash = clashResult.clashes.find((c) => c.severity === 'CRITICAL');
  const shouldBlock = Boolean(criticalClash || (options.strict && clashResult.hasClash));

  if (shouldBlock) {
    const primaryClash = criticalClash || clashResult.clashes[0];
    return {
      isValid: false,
      message: `Module 4 Conflict [${primaryClash.type.toUpperCase()}]: ${primaryClash.message}`,
      clashes: clashResult.clashes,
      summary: clashResult.summary,
    };
  }

  // 11. All validation checks passed (or non-critical warnings noted)
  return {
    isValid: true,
    message: clashResult.hasClash
      ? `Venue and schedule verified with ${clashResult.clashCount} advisory note(s).`
      : 'Venue and time schedule successfully verified by Module 4.',
    clashes: clashResult.clashes,
    clashCount: clashResult.clashCount,
  };
}
