import { NextResponse } from 'next/server';
import { readNotifications, saveNotifications } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

/**
 * GET /api/notifications (and /notifications via middleware)
 * 
 * Fetches notifications for the logged-in user with support for:
 * - ?unreadOnly=true (filter to unread only)
 * - ?type=... (filter by notification type)
 * - ?limit=... (limit results, default 50)
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
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const allNotifications = readNotifications();
    const userNotifications = allNotifications.filter((n) => n.userId === user.id);

    // Calculate unread count across all user notifications
    const unreadCount = userNotifications.filter((n) => !n.isRead).length;

    let filtered = [...userNotifications];

    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead);
    }

    if (type) {
      filtered = filtered.filter((n) => n.type === type);
    }

    if (!isNaN(limit) && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return NextResponse.json(
      {
        success: true,
        unreadCount,
        totalCount: userNotifications.length,
        returnedCount: filtered.length,
        notifications: filtered,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /notifications GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * 
 * Clears/dismisses all notifications for the logged-in user.
 */
export async function DELETE(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const allNotifications = readNotifications();
    const remaining = allNotifications.filter((n) => n.userId !== user.id);
    const deletedCount = allNotifications.length - remaining.length;

    saveNotifications(remaining);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully cleared ${deletedCount} notification(s).`,
        deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /notifications DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear notifications.' },
      { status: 500 }
    );
  }
}
