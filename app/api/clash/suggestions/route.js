import { NextResponse } from 'next/server';
import { getClashSuggestions } from '@/lib/clashEngine';

/**
 * ============================================================================
 * API: GET /api/clash/suggestions (and GET /clash/suggestions)
 * ============================================================================
 * 
 * PURPOSE:
 * When an organiser hits a clash, this API acts as an intelligent helper
 * to recommend clash-free alternatives!
 * 
 * HOW A BABY CAN EXPLAIN THIS:
 * "If your favorite playground swing is taken, this tells you:
 * 1. When the swing will be free later, OR
 * 2. Another awesome swing nearby with enough room for your friends, OR
 * 3. Coming back tomorrow when the swing is empty!"
 * 
 * QUERY PARAMETERS:
 * - ?venue=Main Auditorium
 * - &date=2026-11-20
 * - &startTime=10:00
 * - &endTime=12:00
 * - &capacity=150
 * - &clubName=Coding Club
 * - &targetAudience=3rd-year CSE
 * 
 * RESPONSE (HTTP 200 OK):
 * {
 *   "requested": { ... },
 *   "alternativeSlots": [ ... ],
 *   "alternativeVenues": [ ... ],
 *   "alternativeDates": [ ... ]
 * }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = {
      venue: searchParams.get('venue') || '',
      date: searchParams.get('date') || '',
      startTime: searchParams.get('startTime') || '',
      endTime: searchParams.get('endTime') || '',
      capacity: searchParams.get('capacity') || '100',
      clubName: searchParams.get('clubName') || '',
      targetAudience: searchParams.get('targetAudience') || '',
    };

    const suggestions = getClashSuggestions(query);

    return NextResponse.json(
      {
        message: 'Clash suggestions generated successfully.',
        ...suggestions,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Failed to generate clash suggestions.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
