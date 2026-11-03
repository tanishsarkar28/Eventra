import { NextResponse } from 'next/server';
import { readEvents, readBookmarks } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';
import { calculateRelevanceScore } from '@/lib/recommendation';

// GET /api/events/search?q=keyword
export async function GET(request) {
  try {
    const user = await getLoggedInUser(request);
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim().toLowerCase();

    const allEvents = readEvents();
    const allBookmarks = readBookmarks();

    // Published events
    let events = allEvents.filter(e => e.status === 'Published');

    if (query) {
      events = events.filter(e => {
        const titleMatch = (e.title || '').toLowerCase().includes(query);
        const descMatch = (e.description || '').toLowerCase().includes(query);
        const clubMatch = (e.clubName || e.organiserName || '').toLowerCase().includes(query);
        const catMatch = (e.category || '').toLowerCase().includes(query);
        const tagMatch = Array.isArray(e.tags) && e.tags.some(t => t.toLowerCase().includes(query));
        const venueMatch = (e.venue || '').toLowerCase().includes(query);
        return titleMatch || descMatch || clubMatch || catMatch || tagMatch || venueMatch;
      });
    }

    const userBookmarks = user ? allBookmarks.filter(b => b.userId === user.id) : [];
    const userBookmarkedIds = new Set(userBookmarks.map(b => b.eventId));

    const results = events.map(event => {
      const eventBookmarks = allBookmarks.filter(b => b.eventId === event.id);
      return {
        ...event,
        bookmarkCount: eventBookmarks.length,
        isBookmarked: userBookmarkedIds.has(event.id),
        relevanceScore: calculateRelevanceScore(event, user, eventBookmarks.length),
      };
    });

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json(
      {
        query,
        count: results.length,
        events: results,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to search events' },
      { status: 500 }
    );
  }
}
