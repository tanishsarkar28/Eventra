import { NextResponse } from 'next/server';
import { readReports } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

/**
 * GET /api/admin/reports (and /admin/reports via dual-path middleware)
 * 
 * Lists user moderation reports. Supports ?status=Pending filter.
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let reports = readReports();
    if (status) {
      reports = reports.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    return NextResponse.json(
      {
        success: true,
        count: reports.length,
        reports,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /admin/reports GET] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports.' },
      { status: 500 }
    );
  }
}
