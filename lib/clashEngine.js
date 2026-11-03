/**
 * ============================================================================
 * MODULE 4: VENUE & CLASH MANAGEMENT VALIDATION ENGINE
 * ============================================================================
 * 
 * PURPOSE:
 * This is the smart "traffic controller" for Eventra!
 * Its only job is to stop events from crashing into each other.
 * 
 * ----------------------------------------------------------------------------
 * BABY-SIMPLE EXPLANATION (How to explain this to a 5-year-old):
 * ----------------------------------------------------------------------------
 * Imagine you have a playground slide:
 * 1. VENUE CLASH:
 *    Two kids try to slide down at the exact same time. CRASH!
 *    Rule: Only one event can use a room at a time.
 * 
 * 2. CAPACITY CLASH:
 *    You try to invite 500 kids into a small treehouse built for 50 kids.
 *    The floor will break!
 *    Rule: Event size cannot be bigger than the venue capacity.
 * 
 * 3. ORGANISER CLASH:
 *    The Coding Club wants to run a workshop in Room A AND a hackathon in
 *    Room B at the exact same hour. A club president cannot be in two places at once!
 *    Rule: One club cannot host two different events at the exact same time.
 * 
 * 4. AUDIENCE CLASH:
 *    Two different clubs host events targeting "3rd-Year CSE students"
 *    at 2:00 PM on Friday. The students can't cut themselves in half!
 *    Rule: Don't force the same student audience to choose between two events.
 * 
 * 5. BLACKOUT CLASH:
 *    A club wants to throw a party in the auditorium while semester exams
 *    or roof repairs are happening. NO WAY!
 *    Rule: No events during exam weeks or maintenance blackout periods.
 * 
 * ----------------------------------------------------------------------------
 * THE GOLDEN RULE OF TIME OVERLAP:
 * ----------------------------------------------------------------------------
 * When do two time intervals [start1, end1] and [start2, end2] overlap?
 * 
 *   Event 1:  [start1 = 10:00 ────────────── end1 = 12:00]
 *   Event 2:              [start2 = 11:00 ────────────── end2 = 13:00]
 * 
 * Notice that:
 *   - Event 1 starts BEFORE Event 2 finishes: (start1 < end2) -> (10:00 < 13:00) is TRUE!
 *   - Event 2 starts BEFORE Event 1 finishes: (start2 < end1) -> (11:00 < 12:00) is TRUE!
 * 
 * If BOTH are true, they OVERLAP!
 * In code: (start1 < end2) && (start2 < end1)
 * ============================================================================
 */

import { readVenues, readEvents, readBookings } from '@/lib/db';

/**
 * 1. THE CORE INTERVAL OVERLAP CHECK
 * 
 * Returns true if two time periods overlap on the clock.
 * Time strings are in "HH:MM" 24-hour format (e.g., "09:30", "14:00").
 * 
 * Example:
 * checkTimeOverlap("10:00", "12:00", "11:00", "13:00") -> true (overlap!)
 * checkTimeOverlap("10:00", "12:00", "12:00", "14:00") -> false (one ends exactly when next begins!)
 */
export function checkIntervalOverlap(start1, end1, start2, end2) {
  if (!start1 || !end1 || !start2 || !end2) return false;
  // If start1 is before end2 AND start2 is before end1, they overlap!
  return start1 < end2 && start2 < end1;
}

/**
 * 2. HELPER: Convert "HH:MM" string to minutes from midnight
 * Example: "02:30" -> 2 * 60 + 30 = 150 minutes
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * 3. HELPER: Convert minutes from midnight back to "HH:MM" string
 * Example: 150 minutes -> "02:30"
 */
export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
}

/**
 * 4. HELPER: Clean and normalize text strings for safe matching
 */
export function cleanText(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase();
}

/**
 * 5. HELPER: Check if two target audience descriptions overlap
 * 
 * Examples:
 * - "3rd-year CSE" and "3rd-year CSE" -> YES (Identical audience!)
 * - "3rd Year CSE" and "CSE 3rd-year" -> YES (Same branch & year!)
 * - "CSE" and "3rd-year CSE" -> YES (Subset of CSE!)
 * - "Mechanical" and "CSE" -> NO (Different departments)
 */
export function areAudiencesConflicting(aud1, aud2) {
  const a1 = cleanText(aud1);
  const a2 = cleanText(aud2);

  // If either is empty or generic, no specific audience conflict
  if (!a1 || !a2) return false;
  if (a1 === 'open to all' || a2 === 'open to all') return false;
  if (a1 === 'all' || a2 === 'all') return false;
  if (a1 === 'all students' || a2 === 'all students') return false;

  // Exact match
  if (a1 === a2) return true;

  // One includes the other
  if (a1.includes(a2) || a2.includes(a1)) return true;

  // Check branch tokens (e.g. cse, it, ece, mech, civil, mba, bba, bca)
  const branches = ['cse', 'computer science', 'it', 'information technology', 'ece', 'electronics', 'mech', 'mechanical', 'civil', 'biotech', 'aiml', 'data science'];
  const matchedBranch1 = branches.find((b) => a1.includes(b));
  const matchedBranch2 = branches.find((b) => a2.includes(b));

  // Check year tokens (e.g. 1st, 2nd, 3rd, 4th, 1st-year, 2nd-year, 3rd-year, 4th-year)
  const years = ['1st', '2nd', '3rd', '4th', 'first', 'second', 'third', 'fourth'];
  const matchedYear1 = years.find((y) => a1.includes(y));
  const matchedYear2 = years.find((y) => a2.includes(y));

  // If both mention the same department and same year, it's definitely a conflict!
  if (matchedBranch1 && matchedBranch2 && matchedBranch1 === matchedBranch2) {
    if (matchedYear1 && matchedYear2) {
      return matchedYear1 === matchedYear2;
    }
    // Same branch with no year specified means whole department
    return true;
  }

  return false;
}

/**
 * 6. MAIN CLASH DETECTION ENGINE
 * 
 * Validates any candidate event against:
 * 1. Venue Clashes (CRITICAL)
 * 2. Capacity Clashes (HIGH)
 * 3. Organiser Clashes (HIGH)
 * 4. Audience Clashes (MEDIUM)
 * 5. Blackout Clashes (CRITICAL)
 * 
 * Parameters:
 * - candidate: The event being checked (can be a new event draft or an updated event)
 * - options:
 *     - allEvents: optional custom events array (defaults to reading events.json)
 *     - allVenues: optional custom venues array (defaults to reading venues.json)
 *     - allBookings: optional custom bookings array (defaults to reading bookings.json)
 * 
 * Returns an object with:
 * - hasClash: boolean
 * - hasCriticalClash: boolean
 * - clashes: array of detailed clash objects
 * - summary: count of clashes grouped by severity
 */
export function detectClashes(candidate, options = {}) {
  // Read database records or use passed options
  const events = options.allEvents || readEvents() || [];
  const venues = options.allVenues || readVenues() || [];
  const bookings = options.allBookings || readBookings() || [];

  const clashes = [];

  // Extract candidate attributes safely
  const candidateId = candidate.id || null;
  const candidateDate = candidate.date || '';
  const candidateStart = candidate.startTime || '';
  const candidateEnd = candidate.endTime || '';
  const candidateVenue = cleanText(candidate.venue || '');
  const candidateCapacity = Number(candidate.capacity || candidate.expectedAttendees || 0);
  const candidateClub = cleanText(candidate.clubName || '');
  const candidateOrganiserId = candidate.organiserId || '';
  const candidateAudience = cleanText(candidate.targetAudience || candidate.audience || '');
  const candidateTitle = candidate.title || 'Untitled Event';

  // If basic date and time aren't provided yet, return empty clashes
  if (!candidateDate || !candidateStart || !candidateEnd) {
    return {
      hasClash: false,
      hasCriticalClash: false,
      clashCount: 0,
      clashes: [],
      summary: { critical: 0, high: 0, medium: 0, total: 0 },
    };
  }

  // Find the matching venue in the venues table (if any)
  const matchedVenue = venues.find(
    (v) => cleanText(v.name) === candidateVenue || cleanText(v.id) === candidateVenue
  );

  // ==========================================================================
  // CLASH 1: BLACKOUT CLASH (Exam, Maintenance, or Official Campus Holiday)
  // Severity: CRITICAL
  // ==========================================================================
  // Check if the venue (or campus) is blocked on this date
  const blackoutMatch = bookings.find((b) => {
    if (b.type !== 'blackout') return false;
    if (b.date !== candidateDate) return false;

    // Check if blackout is venue-specific or campus-wide
    const isVenueTargeted = !b.venueId || (matchedVenue && b.venueId === matchedVenue.id) || cleanText(b.venueName) === candidateVenue;
    if (!isVenueTargeted) return false;

    // If the blackout has specific hours, check interval overlap. If no hours, it blocks the entire day!
    if (b.startTime && b.endTime) {
      return checkIntervalOverlap(candidateStart, candidateEnd, b.startTime, b.endTime);
    }
    return true; // All-day blackout
  });

  if (blackoutMatch) {
    clashes.push({
      type: 'Blackout clash',
      severity: 'CRITICAL',
      title: 'Date/Venue Blackout Period',
      message: `The venue '${candidate.venue}' is locked under a blackout on ${candidateDate} due to: ${blackoutMatch.reason || blackoutMatch.title || 'Campus Maintenance/Exams'}.`,
      conflictingEntity: {
        id: blackoutMatch.id,
        title: blackoutMatch.title,
        reason: blackoutMatch.reason,
        note: blackoutMatch.note,
        date: blackoutMatch.date,
        startTime: blackoutMatch.startTime || '00:00',
        endTime: blackoutMatch.endTime || '23:59',
      },
      remedy: 'Choose a different date or select a venue that is not under blackout.',
    });
  }

  // ==========================================================================
  // CLASH 2: CAPACITY CLASH (Expected Attendees Exceed Venue Limit)
  // Severity: HIGH
  // ==========================================================================
  if (matchedVenue && candidateCapacity > 0) {
    const venueCapacity = Number(matchedVenue.capacity || 0);
    if (venueCapacity > 0 && candidateCapacity > venueCapacity) {
      const excess = candidateCapacity - venueCapacity;
      clashes.push({
        type: 'Capacity clash',
        severity: 'HIGH',
        title: 'Venue Capacity Exceeded',
        message: `Expected attendees (${candidateCapacity}) exceed '${matchedVenue.name}' maximum capacity (${venueCapacity}) by ${excess} seats.`,
        conflictingEntity: {
          venueName: matchedVenue.name,
          venueCapacity: venueCapacity,
          requestedCapacity: candidateCapacity,
          excessAttendees: excess,
        },
        remedy: `Reduce event capacity to ${venueCapacity} or move to a larger venue such as the Main Auditorium or Main Sports Ground.`,
      });
    }
  }

  // ==========================================================================
  // CLASH 3: VENUE CLASH (Same Venue, Overlapping Time)
  // Severity: CRITICAL
  // ==========================================================================
  // 3a. Check against already confirmed venue bookings in bookings.json
  const conflictingBooking = bookings.find((b) => {
    if (b.type !== 'booking') return false;
    if (b.status !== 'Approved' && b.status !== 'Confirmed') return false;
    if (b.date !== candidateDate) return false;
    // Skip if booking belongs to this same event being updated
    if (candidateId && b.eventId === candidateId) return false;

    // Check if same venue
    const sameVenue =
      (matchedVenue && b.venueId === matchedVenue.id) ||
      cleanText(b.venueName) === candidateVenue;

    if (!sameVenue) return false;

    // Interval overlap: (start1 < end2) && (start2 < end1)
    return checkIntervalOverlap(candidateStart, candidateEnd, b.startTime, b.endTime);
  });

  if (conflictingBooking) {
    clashes.push({
      type: 'Venue clash',
      severity: 'CRITICAL',
      title: 'Venue Double-Booking Conflict',
      message: `Venue '${candidate.venue}' is already booked on ${candidateDate} from ${conflictingBooking.startTime} to ${conflictingBooking.endTime} for '${conflictingBooking.title}'.`,
      conflictingEvent: {
        id: conflictingBooking.id,
        title: conflictingBooking.title,
        startTime: conflictingBooking.startTime,
        endTime: conflictingBooking.endTime,
        bookedBy: conflictingBooking.requestedByName || 'Another Organiser',
        type: 'Venue Booking',
      },
      remedy: 'Pick a different time slot or another campus venue.',
    });
  }

  // 3b. Check against existing Published or Confirmed events in events.json
  const conflictingVenueEvent = events.find((ev) => {
    // Skip checking itself
    if (candidateId && ev.id === candidateId) return false;
    // Only check active/published events (or pending approval if desired)
    if (ev.status !== 'Published' && ev.status !== 'Confirmed') return false;
    // Must be same date
    if (ev.date !== candidateDate) return false;
    // Must be same venue
    if (cleanText(ev.venue) !== candidateVenue) return false;

    // Golden rule check: start1 < end2 AND start2 < end1
    return checkIntervalOverlap(candidateStart, candidateEnd, ev.startTime, ev.endTime);
  });

  if (conflictingVenueEvent) {
    clashes.push({
      type: 'Venue clash',
      severity: 'CRITICAL',
      title: 'Venue Collision with Published Event',
      message: `Venue '${candidate.venue}' is already occupied on ${candidateDate} from ${conflictingVenueEvent.startTime} to ${conflictingVenueEvent.endTime} by event '${conflictingVenueEvent.title}'.`,
      conflictingEvent: {
        id: conflictingVenueEvent.id,
        title: conflictingVenueEvent.title,
        clubName: conflictingVenueEvent.clubName || conflictingVenueEvent.organiserName,
        startTime: conflictingVenueEvent.startTime,
        endTime: conflictingVenueEvent.endTime,
        status: conflictingVenueEvent.status,
      },
      remedy: `Choose an open slot before ${conflictingVenueEvent.startTime} or after ${conflictingVenueEvent.endTime}.`,
    });
  }

  // ==========================================================================
  // CLASH 4: ORGANISER CLASH (Same Club Hosting Two Events At Once)
  // Severity: HIGH
  // ==========================================================================
  // If the club name or organiser ID is known, check if they are hosting another event at that hour
  if (candidateClub || candidateOrganiserId) {
    const conflictingOrganiserEvent = events.find((ev) => {
      if (candidateId && ev.id === candidateId) return false;
      // Only check against active published events
      if (ev.status !== 'Published' && ev.status !== 'Confirmed') return false;
      if (ev.date !== candidateDate) return false;

      // Check if same club or same organiser user
      const isSameClub = candidateClub && cleanText(ev.clubName) === candidateClub;
      const isSameOrganiser = candidateOrganiserId && ev.organiserId === candidateOrganiserId;

      if (!isSameClub && !isSameOrganiser) return false;

      // Interval overlap check: start1 < end2 AND start2 < end1
      return checkIntervalOverlap(candidateStart, candidateEnd, ev.startTime, ev.endTime);
    });

    if (conflictingOrganiserEvent) {
      clashes.push({
        type: 'Organiser clash',
        severity: 'HIGH',
        title: 'Club Scheduling Overlap',
        message: `Your club ('${conflictingOrganiserEvent.clubName || candidate.clubName}') already has another event '${conflictingOrganiserEvent.title}' scheduled on ${candidateDate} from ${conflictingOrganiserEvent.startTime} to ${conflictingOrganiserEvent.endTime}.`,
        conflictingEvent: {
          id: conflictingOrganiserEvent.id,
          title: conflictingOrganiserEvent.title,
          clubName: conflictingOrganiserEvent.clubName,
          venue: conflictingOrganiserEvent.venue,
          startTime: conflictingOrganiserEvent.startTime,
          endTime: conflictingOrganiserEvent.endTime,
          status: conflictingOrganiserEvent.status,
        },
        remedy: 'Schedule your club events at non-overlapping hours so your team can manage both.',
      });
    }
  }

  // ==========================================================================
  // CLASH 5: AUDIENCE CLASH (Two Events Targeting Same Audience At Once)
  // Severity: MEDIUM
  // ==========================================================================
  if (candidateAudience) {
    const conflictingAudienceEvent = events.find((ev) => {
      if (candidateId && ev.id === candidateId) return false;
      // Only check against active published events
      if (ev.status !== 'Published' && ev.status !== 'Confirmed') return false;
      if (ev.date !== candidateDate) return false;

      // Check if target audiences conflict (e.g. both target "3rd-year CSE")
      const evAudience = ev.targetAudience || ev.audience || '';
      const isAudienceOverlap = areAudiencesConflicting(candidateAudience, evAudience);
      if (!isAudienceOverlap) return false;

      // Interval overlap check: start1 < end2 AND start2 < end1
      return checkIntervalOverlap(candidateStart, candidateEnd, ev.startTime, ev.endTime);
    });

    if (conflictingAudienceEvent) {
      clashes.push({
        type: 'Audience clash',
        severity: 'MEDIUM',
        title: 'Target Audience Division',
        message: `Event '${conflictingAudienceEvent.title}' is targeting the same audience ('${conflictingAudienceEvent.targetAudience || candidateAudience}') on ${candidateDate} from ${conflictingAudienceEvent.startTime} to ${conflictingAudienceEvent.endTime}.`,
        conflictingEvent: {
          id: conflictingAudienceEvent.id,
          title: conflictingAudienceEvent.title,
          targetAudience: conflictingAudienceEvent.targetAudience,
          clubName: conflictingAudienceEvent.clubName,
          startTime: conflictingAudienceEvent.startTime,
          endTime: conflictingAudienceEvent.endTime,
        },
        remedy: 'Pick a different time or date so students do not have to pick between events.',
      });
    }
  }

  // Count summaries
  const critical = clashes.filter((c) => c.severity === 'CRITICAL').length;
  const high = clashes.filter((c) => c.severity === 'HIGH').length;
  const medium = clashes.filter((c) => c.severity === 'MEDIUM').length;

  return {
    hasClash: clashes.length > 0,
    hasCriticalClash: critical > 0,
    clashCount: clashes.length,
    clashes: clashes,
    summary: {
      critical,
      high,
      medium,
      total: clashes.length,
    },
  };
}

/**
 * 7. ALTERNATIVE SUGGESTIONS ENGINE
 * 
 * When a clash occurs, this function calculates helpful alternatives:
 * 1. Alternative open time slots at the same venue on the same day.
 * 2. Alternative venues that have sufficient capacity and are completely free at that time.
 * 3. Alternative nearby dates when the requested venue is completely open.
 */
export function getClashSuggestions(query = {}) {
  const venues = readVenues();
  const events = readEvents();
  const bookings = readBookings();

  const reqVenueName = query.venue || '';
  const reqDate = query.date || '';
  const reqStart = query.startTime || '10:00';
  const reqEnd = query.endTime || '12:00';
  const reqCapacity = Number(query.capacity || 100);

  const durationMinutes = Math.max(30, timeToMinutes(reqEnd) - timeToMinutes(reqStart));

  const matchedVenue = venues.find(
    (v) => cleanText(v.name) === cleanText(reqVenueName)
  );

  const suggestions = {
    requested: {
      venue: reqVenueName,
      date: reqDate,
      startTime: reqStart,
      endTime: reqEnd,
      capacity: reqCapacity,
      durationMinutes,
    },
    alternativeSlots: [],
    alternativeVenues: [],
    alternativeDates: [],
  };

  // 1. Suggest Alternative Slots at Same Venue (on same day)
  if (matchedVenue && reqDate) {
    const venueOpen = timeToMinutes(matchedVenue.availableFrom || '08:00');
    const venueClose = timeToMinutes(matchedVenue.availableTo || '20:00');

    // Collect all booked intervals on that date for this venue
    const occupiedIntervals = [];

    // From bookings.json
    bookings.forEach((b) => {
      if (b.date === reqDate && (b.venueId === matchedVenue.id || cleanText(b.venueName) === cleanText(matchedVenue.name))) {
        if (b.status === 'Confirmed' || b.status === 'Approved' || b.type === 'blackout') {
          occupiedIntervals.push({
            start: timeToMinutes(b.startTime || '08:00'),
            end: timeToMinutes(b.endTime || '20:00'),
            title: b.title || b.reason || 'Booked',
          });
        }
      }
    });

    // From events.json
    events.forEach((ev) => {
      if (ev.date === reqDate && cleanText(ev.venue) === cleanText(matchedVenue.name)) {
        if (ev.status === 'Published') {
          occupiedIntervals.push({
            start: timeToMinutes(ev.startTime),
            end: timeToMinutes(ev.endTime),
            title: ev.title,
          });
        }
      }
    });

    // Sort intervals by start time
    occupiedIntervals.sort((a, b) => a.start - b.start);

    // Compute free windows between venueOpen and venueClose
    let currentPointer = venueOpen;
    occupiedIntervals.forEach((interval) => {
      if (interval.start > currentPointer) {
        const freeWindow = interval.start - currentPointer;
        if (freeWindow >= durationMinutes) {
          suggestions.alternativeSlots.push({
            startTime: minutesToTime(currentPointer),
            endTime: minutesToTime(currentPointer + durationMinutes),
            venue: matchedVenue.name,
            windowMinutes: freeWindow,
            note: `Available slot (${minutesToTime(currentPointer)} - ${minutesToTime(interval.start)})`,
          });
        }
      }
      currentPointer = Math.max(currentPointer, interval.end);
    });

    // Remaining window after last booking
    if (venueClose - currentPointer >= durationMinutes) {
      suggestions.alternativeSlots.push({
        startTime: minutesToTime(currentPointer),
        endTime: minutesToTime(currentPointer + durationMinutes),
        venue: matchedVenue.name,
        windowMinutes: venueClose - currentPointer,
        note: `Available slot (${minutesToTime(currentPointer)} - ${minutesToTime(venueClose)})`,
      });
    }
  }

  // 2. Suggest Alternative Venues (at the exact requested time & date)
  if (reqDate && reqStart && reqEnd) {
    venues.forEach((v) => {
      if (v.isActive === false) return;
      if (cleanText(v.name) === cleanText(reqVenueName)) return; // Skip the clashed venue

      // Check capacity
      if (reqCapacity > 0 && Number(v.capacity) < reqCapacity) return;

      // Check operating hours
      if (v.availableFrom && reqStart < v.availableFrom) return;
      if (v.availableTo && reqEnd > v.availableTo) return;

      // Check clash for this alternative venue
      const testEvent = {
        venue: v.name,
        date: reqDate,
        startTime: reqStart,
        endTime: reqEnd,
        capacity: reqCapacity,
      };

      const check = detectClashes(testEvent, { allVenues: venues, allEvents: events, allBookings: bookings });
      const hasVenueOrBlackoutClash = check.clashes.some(
        (c) => c.type === 'Venue clash' || c.type === 'Blackout clash'
      );

      if (!hasVenueOrBlackoutClash) {
        suggestions.alternativeVenues.push({
          id: v.id,
          name: v.name,
          type: v.type,
          capacity: v.capacity,
          location: v.location,
          facilities: v.facilities || [],
          operatingHours: `${v.availableFrom || '08:00'} - ${v.availableTo || '20:00'}`,
        });
      }
    });
  }

  // 3. Suggest Alternative Nearby Dates (for the same venue and time slot)
  if (matchedVenue && reqDate) {
    const baseDate = new Date(reqDate);
    if (!isNaN(baseDate.getTime())) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Look at the next 7 days
      for (let offset = 1; offset <= 7; offset++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + offset);

        const yyyy = nextDate.getFullYear();
        const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
        const dd = String(nextDate.getDate()).padStart(2, '0');
        const nextDateStr = `${yyyy}-${mm}-${dd}`;
        const dayOfWeek = dayNames[nextDate.getDay()];

        // Check if venue is open on that day
        if (matchedVenue.availableDays && !matchedVenue.availableDays.includes(dayOfWeek)) {
          continue;
        }

        // Test clash on nextDate
        const testEvent = {
          venue: matchedVenue.name,
          date: nextDateStr,
          startTime: reqStart,
          endTime: reqEnd,
          capacity: reqCapacity,
        };

        const check = detectClashes(testEvent, { allVenues: venues, allEvents: events, allBookings: bookings });
        if (!check.hasClash) {
          suggestions.alternativeDates.push({
            date: nextDateStr,
            dayOfWeek: dayOfWeek,
            venue: matchedVenue.name,
            startTime: reqStart,
            endTime: reqEnd,
          });
          if (suggestions.alternativeDates.length >= 3) break; // Suggest up to 3 dates
        }
      }
    }
  }

  return suggestions;
}

/**
 * 8. SYSTEM CLASH REPORT GENERATOR
 * 
 * Scans every event in the system and compiles a complete health report:
 * - Total events checked
 * - Total clashes found
 * - Breakdown by clash type
 * - Breakdown by severity
 * - Full list of events with clashes and their conflicting items
 */
export function generateSystemClashReport() {
  const events = readEvents() || [];
  const venues = readVenues() || [];
  const bookings = readBookings() || [];

  const reports = [];
  let totalVenueClashes = 0;
  let totalCapacityClashes = 0;
  let totalOrganiserClashes = 0;
  let totalAudienceClashes = 0;
  let totalBlackoutClashes = 0;

  let totalCritical = 0;
  let totalHigh = 0;
  let totalMedium = 0;

  events.forEach((event) => {
    // Only evaluate non-cancelled events
    if (event.status === 'Cancelled') return;

    const clashResult = detectClashes(event, {
      allEvents: events,
      allVenues: venues,
      allBookings: bookings,
    });

    if (clashResult.hasClash) {
      clashResult.clashes.forEach((c) => {
        if (c.type === 'Venue clash') totalVenueClashes++;
        else if (c.type === 'Capacity clash') totalCapacityClashes++;
        else if (c.type === 'Organiser clash') totalOrganiserClashes++;
        else if (c.type === 'Audience clash') totalAudienceClashes++;
        else if (c.type === 'Blackout clash') totalBlackoutClashes++;

        if (c.severity === 'CRITICAL') totalCritical++;
        else if (c.severity === 'HIGH') totalHigh++;
        else if (c.severity === 'MEDIUM') totalMedium++;
      });

      reports.push({
        event: {
          id: event.id,
          title: event.title,
          status: event.status,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          venue: event.venue,
          capacity: event.capacity,
          clubName: event.clubName || event.organiserName,
          targetAudience: event.targetAudience || 'General',
          adminOverride: event.adminOverride || false,
          overrideReason: event.overrideReason || '',
        },
        hasCriticalClash: clashResult.hasCriticalClash,
        clashes: clashResult.clashes,
        summary: clashResult.summary,
      });
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    totalEventsChecked: events.length,
    eventsWithClashesCount: reports.length,
    totalClashesFound: totalVenueClashes + totalCapacityClashes + totalOrganiserClashes + totalAudienceClashes + totalBlackoutClashes,
    breakdownByType: {
      venueClashes: totalVenueClashes,
      capacityClashes: totalCapacityClashes,
      organiserClashes: totalOrganiserClashes,
      audienceClashes: totalAudienceClashes,
      blackoutClashes: totalBlackoutClashes,
    },
    breakdownBySeverity: {
      critical: totalCritical,
      high: totalHigh,
      medium: totalMedium,
    },
    reports,
  };
}
