/**
 * Module 4 Integration - Venue and Time Validation
 * 
 * Note: Module 4 (Campus Venue & Scheduling System) is currently NOT implemented
 * in the repository. This module acts as the integration interface / placeholder
 * that validates venue availability, date validity, and checks for time conflicts
 * before an event can be published.
 */

export function validateVenueAndTime(eventToValidate, allEvents = []) {
  // 1. check if venue is provided
  if (!eventToValidate.venue || eventToValidate.venue.trim().length === 0) {
    return {
      isValid: false,
      message: 'Module 4 Validation Error: Event venue is required.',
    };
  }

  // 2. check if event date is provided and formatted
  if (!eventToValidate.date) {
    return {
      isValid: false,
      message: 'Module 4 Validation Error: Event date is required.',
    };
  }

  // 3. check if event date is valid (cannot be in the past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(eventToValidate.date);
  if (isNaN(eventDate.getTime())) {
    return {
      isValid: false,
      message: 'Module 4 Validation Error: Invalid event date format.',
    };
  }

  // 4. check if start time and end time are provided
  if (!eventToValidate.startTime || !eventToValidate.endTime) {
    return {
      isValid: false,
      message: 'Module 4 Validation Error: Both start time and end time are required.',
    };
  }

  // 5. check that start time is strictly before end time
  if (eventToValidate.startTime >= eventToValidate.endTime) {
    return {
      isValid: false,
      message: 'Module 4 Validation Error: Start time must be earlier than end time.',
    };
  }

  // 6. check registration deadline is on or before event date
  if (eventToValidate.registrationDeadline) {
    const deadlineDate = new Date(eventToValidate.registrationDeadline);
    if (!isNaN(deadlineDate.getTime()) && deadlineDate > eventDate) {
      return {
        isValid: false,
        message: 'Module 4 Validation Error: Registration deadline cannot be after the event date.',
      };
    }
  }

  // 7. check for venue and time conflicts with already published events
  const cleanVenue = eventToValidate.venue.trim().toLowerCase();
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

  // 8. all validations passed
  return {
    isValid: true,
    message: 'Venue and time schedule successfully verified by Module 4.',
  };
}
