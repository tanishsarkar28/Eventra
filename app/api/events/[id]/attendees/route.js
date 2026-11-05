import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getEventAttendees } from '@/lib/registrationEngine';

/**
 * GET /api/events/:id/attendees (and /events/:id/attendees)
 * Organiser & Admin inspection of attendees, waitlist and attendance metrics.
 * Supports CSV export via `?format=csv` or `Accept: text/csv`.
 */
export async function GET(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const acceptHeader = request.headers.get('accept') || '';
    const isCsvRequested =
      searchParams.get('format') === 'csv' || acceptHeader.includes('text/csv');

    const result = await getEventAttendees({
      eventId: id,
      user,
      format: isCsvRequested ? 'csv' : 'json',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 }
      );
    }

    if (result.format === 'csv') {
      return new Response(result.data, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${result.filename}"`,
        },
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching attendees.' },
      { status: 500 }
    );
  }
}
