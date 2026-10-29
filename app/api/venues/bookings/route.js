import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { readBookings } from '@/lib/db';

// ==================== GET /api/venues/bookings ====================
// List all bookings across all venues (Authenticated users).
export async function GET(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const bookings = readBookings();
    let result = bookings.filter(b => b.type === 'booking');

    if (statusFilter) {
      result = result.filter(b => b.status === statusFilter);
    }

    // Sort by date, startTime descending
    result.sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

    return NextResponse.json({ bookings: result }, { status: 200 });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    return NextResponse.json(
      { message: 'Internal server error while fetching bookings' },
      { status: 500 }
    );
  }
}
