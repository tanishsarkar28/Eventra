import { NextResponse } from 'next/server';
import { readEmailOutbox, readPushOutbox } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

/**
 * GET /api/notifications/outbox
 * 
 * Inspects simulated email and push outbox transmissions.
 * Useful for students and evaluators to observe the multi-channel dispatch!
 */
export async function GET(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel'); // 'email' | 'push'

    const emailOutbox = readEmailOutbox();
    const pushOutbox = readPushOutbox();

    // If student/organiser, filter to only their own messages (or show all for admin)
    const isAdmin = user.role === 'admin';

    const userEmails = isAdmin
      ? emailOutbox
      : emailOutbox.filter((e) => e.to === user.email);

    const userPush = isAdmin
      ? pushOutbox
      : pushOutbox.filter((p) => p.userId === user.id);

    if (channel === 'email') {
      return NextResponse.json({ success: true, channel: 'email', count: userEmails.length, outbox: userEmails });
    }

    if (channel === 'push') {
      return NextResponse.json({ success: true, channel: 'push', count: userPush.length, outbox: userPush });
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalEmails: userEmails.length,
          totalPush: userPush.length,
        },
        emails: userEmails.slice(0, 20),
        push: userPush.slice(0, 20),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /notifications/outbox GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch outbox.' },
      { status: 500 }
    );
  }
}
