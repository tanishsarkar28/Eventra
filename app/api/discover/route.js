import { NextResponse } from 'next/server';
import { readEvents, readBookmarks } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';
import { calculateRelevanceScore } from '@/lib/recommendation';

// GET /api/discover - feed of upcoming published events with search & filters
export async function GET(request) {
  try {
    const user = await getLoggedInUser(request);
    const { searchParams } = new URL(request.url);

    // Filter queries
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const category = searchParams.get('category') || '';
    const venue = searchParams.get('venue') || '';
    const club = searchParams.get('club') || '';
    const pricing = searchParams.get('pricing') || ''; // 'free' or 'paid'
    const date = searchParams.get('date') || '';
    const sort = searchParams.get('sort') || 'recommended'; // recommended, date, trending, popular

    const allEvents = readEvents();
    const allBookmarks = readBookmarks();

    // 1. Only show Published events in discovery feed
    let events = allEvents.filter(e => e.status === 'Published');

    // 2. Search query filter (title, description, tags, club)
    if (q) {
      events = events.filter(e => {
        const titleMatch = (e.title || '').toLowerCase().includes(q);
        const descMatch = (e.description || '').toLowerCase().includes(q);
        const clubMatch = (e.clubName || e.organiserName || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(e.tags) && e.tags.some(t => t.toLowerCase().includes(q));
        return titleMatch || descMatch || clubMatch || tagMatch;
      });
    }

    // 3. Category filter
    if (category) {
      events = events.filter(e => (e.category || '').toLowerCase() === category.toLowerCase());
    }

    // 4. Venue filter
    if (venue) {
      events = events.filter(e => (e.venue || '').toLowerCase().includes(venue.toLowerCase()));
    }

    // 5. Club/Organiser filter
    if (club) {
      events = events.filter(e => 
        (e.clubName || '').toLowerCase().includes(club.toLowerCase()) ||
        (e.organiserName || '').toLowerCase().includes(club.toLowerCase())
      );
    }

    // 6. Pricing filter (free / paid)
    if (pricing === 'free') {
      events = events.filter(e => !e.isPaid || Number(e.ticketPrice) === 0);
    } else if (pricing === 'paid') {
      events = events.filter(e => e.isPaid && Number(e.ticketPrice) > 0);
    }

    // 7. Date filter
    if (date) {
      events = events.filter(e => e.date === date);
    }

    // 8. Enrich events with bookmark count, user bookmarked state, and relevance score
    const userBookmarks = user ? allBookmarks.filter(b => b.userId === user.id) : [];
    const userBookmarkedIds = new Set(userBookmarks.map(b => b.eventId));

    const enrichedEvents = events.map(event => {
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

    // 9. Sorting
    if (sort === 'recommended') {
      enrichedEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sort === 'trending' || sort === 'popular') {
      enrichedEvents.sort((a, b) => (b.bookmarkCount || 0) - (a.bookmarkCount || 0));
    } else if (sort === 'date') {
      enrichedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return NextResponse.json(
      {
        total: enrichedEvents.length,
        events: enrichedEvents,
        currentUser: user ? { id: user.id, name: user.name, interests: user.interests, branch: user.branch } : null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch discovery feed' },
      { status: 500 }
    );
  }
}
