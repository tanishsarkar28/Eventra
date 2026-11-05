import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import {
  registerStudent,
  unregisterStudent,
  getStudentRegistrationStatus,
} from '@/lib/registrationEngine';

/**
 * POST /api/events/:id/register (and /events/:id/register)
 * One-click registration with capacity enforcement, waitlisting,
 * registration form fields (team size, custom questions),
 * QR ticket generation, and Module 8 personal schedule clash check.
 */
export async function POST(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to register for this event.' },
        { status: 401 }
      );
    }

    const { id } = params;
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { teamSize, teamMembers, answers, allowClash } = body;

    const result = await registerStudent({
      eventId: id,
      user,
      teamSize,
      teamMembers,
      answers,
      allowClash: Boolean(allowClash),
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          isClash: Boolean(result.isClash),
          conflictingEvent: result.conflictingEvent || null,
          waitlistPosition: result.waitlistPosition || null,
        },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json(result, { status: result.status === 'Waitlisted' ? 200 : 201 });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Internal server error while registering.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/:id/register (and /events/:id/register)
 * Unregister / cancel registration.
 * Checks cancellation window and automatically promotes the next student on waitlist.
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to cancel registration.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const result = await unregisterStudent({
      eventId: id,
      user,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return NextResponse.json(
      { error: 'Internal server error while cancelling registration.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/events/:id/register (and /events/:id/register)
 * Fetches current user's registration status and QR ticket.
 */
export async function GET(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json({ isRegistered: false, status: null });
    }

    const { id } = params;
    const status = await getStudentRegistrationStatus(id, user.id);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching registration status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration status.' },
      { status: 500 }
    );
  }
}
