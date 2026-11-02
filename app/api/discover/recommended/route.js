import { NextResponse } from 'next/server';
import { readEvents, readBookmarks } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';
import { calculateRelevanceScore } from '@/lib/recommendation';

// GET /api/discover/recommended - returns personalized events ranked by "relevant to me" score
export async function GET(request) {
  try {
    const user = await getLoggedInUser(request);
    const allEvents = readEvents();
    const allBookmarks = readBookmarks();

    // Only Published events
    const publishedEvents = allEvents.filter(e => e.status === 'Published');

    const userBookmarks = user ? allBookmarks.filter(b => b.userId === user.id) : [];
    const userBookmarkedIds = new Set(userBookmarks.map(b => b.eventId));

    const recommendedEvents = publishedEvents.map(event => {
      const eventBookmarks = allBookmarks.filter(b => b.eventId === event.id);
      const isBookmarked = userBookmarkedIds.has(event.id);
      const relevanceScore = calculateRelevanceScore(event, user, eventBookmarks.length);

      return {
        ...event,
        bookmarkCount: eventBookmarks.length,
        isBookmarked,
        relevanceScore,
      };
    });

    // Rank in descending order of relevance score
    recommendedEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json(
      {
        total: recommendedEvents.length,
        events: recommendedEvents,
        personalizedFor: user ? {
          name: user.name,
          branch: user.branch,
          year: user.year,
          interests: user.interests,
        } : null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
