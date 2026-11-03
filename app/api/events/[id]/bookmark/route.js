import { NextResponse } from 'next/server';
import { readEvents, readBookmarks, saveBookmarks } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

// POST /api/events/[id]/bookmark - toggle save/bookmark an event for current student
export async function POST(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in first to bookmark events.' },
        { status: 401 }
      );
    }

    const { id: eventId } = params;
    const allEvents = readEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    const bookmarks = readBookmarks();
    const existingIndex = bookmarks.findIndex(
      b => b.userId === user.id && b.eventId === eventId
    );

    let isBookmarked = false;

    if (existingIndex > -1) {
      // Already bookmarked -> Remove bookmark (Unsave)
      bookmarks.splice(existingIndex, 1);
      isBookmarked = false;
    } else {
      // Not yet bookmarked -> Add bookmark
      bookmarks.push({
        id: Date.now().toString(),
        userId: user.id,
        eventId: eventId,
        createdAt: new Date().toISOString(),
      });
      isBookmarked = true;
    }

    saveBookmarks(bookmarks);

    const updatedEventBookmarks = bookmarks.filter(b => b.eventId === eventId).length;

    return NextResponse.json(
      {
        message: isBookmarked ? 'Event bookmarked successfully' : 'Event bookmark removed',
        isBookmarked,
        bookmarkCount: updatedEventBookmarks,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update bookmark' },
      { status: 500 }
    );
  }
}
