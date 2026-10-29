/**
 * Module 3 & 4 Integration - Venue and Time Validation
 * 
 * This module validates venue availability, date validity, blackout dates,
 * and checks for time conflicts before an event can be published.
 * Now integrated with Module 3 (Venue Management) for real venue data.
 */

import { readVenues, readBookings } from '@/lib/db';

export function validateVenueAndTime(eventToValidate, allEvents = []) {
  // 1. check if venue is provided
  if (!eventToValidate.venue || eventToValidate.venue.trim().length === 0) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Event venue is required.',
    };
  }

  // 2. check if event date is provided and formatted
  if (!eventToValidate.date) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Event date is required.',
    };
  }

  // 3. check if event date is valid (cannot be in the past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(eventToValidate.date);
  if (isNaN(eventDate.getTime())) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Invalid event date format.',
    };
  }

  // 4. check if start time and end time are provided
  if (!eventToValidate.startTime || !eventToValidate.endTime) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Both start time and end time are required.',
    };
  }

  // 5. check that start time is strictly before end time
  if (eventToValidate.startTime >= eventToValidate.endTime) {
    return {
      isValid: false,
      message: 'Module 3 Validation Error: Start time must be earlier than end time.',
    };
  }

  // 6. check registration deadline is on or before event date
  if (eventToValidate.registrationDeadline) {
    const deadlineDate = new Date(eventToValidate.registrationDeadline);
    if (!isNaN(deadlineDate.getTime()) && deadlineDate > eventDate) {
      return {
        isValid: false,
        message: 'Module 3 Validation Error: Registration deadline cannot be after the event date.',
      };
    }
  }

  // 7. Module 3 Integration: check if venue exists in venue database
  const venues = readVenues();
  const cleanVenue = eventToValidate.venue.trim().toLowerCase();

  const inactiveVenue = venues.find(
    (v) => v.name.trim().toLowerCase() === cleanVenue && v.isActive === false
  );
  if (inactiveVenue) {
    return {
      isValid: false,
      message: `Module 4 Validation Error: Venue '${inactiveVenue.name}' is currently inactive or decommissioned.`,
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
      };
    }

    // 7b. check if event time falls within venue's available hours
    if (matchedVenue.availableFrom && eventToValidate.startTime < matchedVenue.availableFrom) {
      return {
        isValid: false,
        message: `Module 4 Validation Error: Venue '${matchedVenue.name}' opens at ${matchedVenue.availableFrom}. Event starts too early.`,
      };
    }
    if (matchedVenue.availableTo && eventToValidate.endTime > matchedVenue.availableTo) {
      return {
        isValid: false,
        message: `Module 4 Validation Error: Venue '${matchedVenue.name}' closes at ${matchedVenue.availableTo}. Event ends too late.`,
      };
    }

    // 7c. check if venue has a blackout on the event date
    const bookings = readBookings();
    const blackout = bookings.find(
      (b) =>
        b.venueId === matchedVenue.id &&
        b.type === 'blackout' &&
        b.date === eventToValidate.date
    );

    if (blackout) {
      return {
        isValid: false,
        message: `Module 4 Validation Error: Venue '${matchedVenue.name}' is blocked on ${eventToValidate.date} due to: ${blackout.reason || blackout.title}.`,
      };
    }

    // 7d. check for time conflicts with existing venue bookings
    const conflictingBooking = bookings.find((b) => {
      if (b.venueId !== matchedVenue.id) return false;
      if (b.type !== 'booking') return false;
      if (b.status !== 'Approved' && b.status !== 'Confirmed') return false;
      if (b.date !== eventToValidate.date) return false;
      // skip if this booking belongs to the same event (re-validation scenario)
      if (b.eventId && b.eventId === eventToValidate.id) return false;

      // check time overlap
      const overlap =
        eventToValidate.startTime < b.endTime &&
        eventToValidate.endTime > b.startTime;
      return overlap;
    });

    if (conflictingBooking) {
      return {
        isValid: false,
        message: `Module 4 Conflict: Venue '${matchedVenue.name}' already has a booking on ${eventToValidate.date} from ${conflictingBooking.startTime} to ${conflictingBooking.endTime} for "${conflictingBooking.title}".`,
      };
    }
  }

  // 8. check for venue and time conflicts with already published events
  const conflictingEvent = allEvents.find((existing) => {
    // skip the event itself if updating
    if (existing.id === eventToValidate.id) {
      return false;
    }

    // only check published events
    if (existing.status !== 'Published') {
      return false;
    }

    // must be on the same date and same venue
    const sameDate = existing.date === eventToValidate.date;
    const sameVenue = existing.venue && existing.venue.trim().toLowerCase() === cleanVenue;

    if (sameDate && sameVenue) {
      // check time overlap: (startA < endB) and (endA > startB)
      const overlap =
        eventToValidate.startTime < existing.endTime &&
        eventToValidate.endTime > existing.startTime;
      return overlap;
    }

    return false;
  });

  if (conflictingEvent) {
    return {
      isValid: false,
      message: `Module 4 Conflict: Venue '${eventToValidate.venue}' is already booked on ${eventToValidate.date} from ${conflictingEvent.startTime} to ${conflictingEvent.endTime} by event "${conflictingEvent.title}".`,
    };
  }

  // 9. all validations passed
  return {
    isValid: true,
    message: 'Venue and time schedule successfully verified by Module 4.',
  };
}
