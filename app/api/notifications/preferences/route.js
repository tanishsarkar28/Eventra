import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getUserPreferences, saveUserPreferences } from '@/lib/notifications';

/**
 * GET /api/notifications/preferences (and /notifications/preferences)
 * 
 * Retrieves notification preferences for the logged-in user.
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

    const preferences = getUserPreferences(user.id);

    return NextResponse.json(
      {
        success: true,
        preferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /notifications/preferences GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification preferences.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences (and /notifications/preferences)
 * 
 * Updates notification preferences for the logged-in user.
 */
export async function PUT(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const updated = saveUserPreferences(user.id, body);

    return NextResponse.json(
      {
        success: true,
        message: 'Notification preferences updated successfully.',
        preferences: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /notifications/preferences PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences.' },
      { status: 500 }
    );
  }
}
