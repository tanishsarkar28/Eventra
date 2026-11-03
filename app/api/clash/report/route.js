import { NextResponse } from 'next/server';
import { generateSystemClashReport } from '@/lib/clashEngine';

/**
 * ============================================================================
 * API: GET /api/clash/report (and GET /clash/report)
 * ============================================================================
 * 
 * PURPOSE:
 * Generates an end-to-end clash audit report of the entire campus schedule!
 * 
 * HOW A BABY CAN EXPLAIN THIS:
 * "It's like looking at the entire school calendar with X-ray vision to make sure
 * no two classes are fighting over the gym, no classrooms are overpacked, and no
 * events are booked during exam week!"
 * 
 * RESPONSE (HTTP 200 OK):
 * {
 *   "generatedAt": "2026-11-02T...",
 *   "totalEventsChecked": 10,
 *   "eventsWithClashesCount": 2,
 *   "totalClashesFound": 3,
 *   "breakdownByType": {
 *     "venueClashes": 1,
 *     "capacityClashes": 1,
 *     "organiserClashes": 0,
 *     "audienceClashes": 1,
 *     "blackoutClashes": 0
 *   },
 *   "breakdownBySeverity": {
 *     "critical": 1,
 *     "high": 1,
 *     "medium": 1
 *   },
 *   "reports": [ ... ]
 * }
 */
export async function GET() {
  try {
    const report = generateSystemClashReport();

    return NextResponse.json(
      {
        message: 'System clash report compiled successfully.',
        ...report,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Failed to generate system clash report.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
