import { NextResponse } from 'next/server';
import { detectClashes } from '@/lib/clashEngine';

/**
 * ============================================================================
 * API: POST /api/clash/check (and POST /clash/check)
 * ============================================================================
 * 
 * PURPOSE:
 * Checks whether an event has any conflicts before saving or submitting.
 * 
 * HOW A BABY CAN EXPLAIN THIS:
 * "Before you set up your lemonade stand, you ask Mom if someone else is already
 * using that table, or if it's going to rain, or if you don't have enough cups!"
 * 
 * REQUEST BODY:
 * {
 *   "id": "optional_event_id",       // if editing existing event, to exclude itself
 *   "venue": "Main Auditorium",      // venue name or ID
 *   "date": "2026-11-20",            // event date (YYYY-MM-DD)
 *   "startTime": "10:00",            // event start time (HH:MM)
 *   "endTime": "12:00",              // event end time (HH:MM)
 *   "capacity": 150,                 // expected attendee count
 *   "clubName": "Robotics Club",     // club hosting the event
 *   "organiserId": "user_123",       // user ID of organiser
 *   "targetAudience": "3rd-year CSE" // targeted student group
 * }
 * 
 * RESPONSE (HTTP 200 OK):
 * {
 *   "hasClash": true | false,
 *   "hasCriticalClash": true | false,
 *   "clashCount": 2,
 *   "clashes": [
 *     {
 *       "type": "Venue clash",
 *       "severity": "CRITICAL",
 *       "title": "...",
 *       "message": "...",
 *       "conflictingEvent": { ... },
 *       "remedy": "..."
 *     }
 *   ],
 *   "summary": { "critical": 1, "high": 1, "medium": 0, "total": 2 }
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Run the Module 4 Clash Engine
    const result = detectClashes(body);

    return NextResponse.json(
      {
        message: result.hasClash
          ? `Module 4 Alert: ${result.clashCount} clash(es) detected.`
          : 'All clear! No clashes detected by Module 4.',
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Failed to perform clash check.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
