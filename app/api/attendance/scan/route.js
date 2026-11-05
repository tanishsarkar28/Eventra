import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { scanAttendance } from '@/lib/registrationEngine';

/**
 * POST /api/attendance/scan (and /attendance/scan)
 * QR Check-in by organiser or administrator.
 * Validates ticket, prevents double check-ins, and logs AttendanceRecord.
 */
export async function POST(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { ticketCode, qrData, eventId } = body;
    const code = ticketCode || qrData;

    if (!code) {
      return NextResponse.json(
        { error: 'Ticket code is required for check-in.' },
        { status: 400 }
      );
    }

    const result = await scanAttendance({
      ticketCode: code,
      eventId,
      organiserUser: user,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          alreadyUsed: Boolean(result.alreadyUsed),
        },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error scanning attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error during attendance check-in.' },
      { status: 500 }
    );
  }
}
