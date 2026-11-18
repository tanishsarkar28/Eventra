import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { computeAnalytics } from '@/lib/analyticsEngine';

/**
 * GET /api/admin/analytics (and /admin/analytics via dual-path middleware)
 * 
 * Returns executive oversight analytics for the administration:
 * 1. Events per week
 * 2. Venue utilisation (%)
 * 3. Registration vs attendance check-in rate (%)
 * 4. Popular categories
 * 5. Clash frequency
 */
export async function GET(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const analytics = computeAnalytics();

    return NextResponse.json(
      {
        success: true,
        analytics,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /admin/analytics GET] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to compute administrative analytics.' },
      { status: 500 }
    );
  }
}
