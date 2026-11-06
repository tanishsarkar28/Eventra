import { NextResponse } from 'next/server';
import { readNotifications, saveNotifications } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

/**
 * PATCH /api/notifications/:id/read (and /notifications/:id/read)
 * 
 * Marks a notification (or all notifications if :id is 'all') as read.
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const allNotifications = readNotifications();
    const now = new Date().toISOString();

    // Case 1: Batch mark all as read
    if (id === 'all') {
      let updatedCount = 0;
      for (const notif of allNotifications) {
        if (notif.userId === user.id && !notif.isRead) {
          notif.isRead = true;
          notif.readAt = now;
          updatedCount++;
        }
      }

      saveNotifications(allNotifications);

      return NextResponse.json(
        {
          success: true,
          message: `All notifications marked as read (${updatedCount} updated).`,
          updatedCount,
        },
        { status: 200 }
      );
    }

    // Case 2: Mark specific notification as read
    const notifIndex = allNotifications.findIndex((n) => n.id === id);
    if (notifIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Notification not found.' },
        { status: 404 }
      );
    }

    const notification = allNotifications[notifIndex];

    // Security check: ensure notification belongs to the logged-in user
    if (notification.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You cannot modify another user\'s notification.' },
        { status: 403 }
      );
    }

    notification.isRead = true;
    notification.readAt = now;

    allNotifications[notifIndex] = notification;
    saveNotifications(allNotifications);

    return NextResponse.json(
      {
        success: true,
        message: 'Notification marked as read.',
        notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /notifications/:id/read PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification status.' },
      { status: 500 }
    );
  }
}
