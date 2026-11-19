'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  readEvents,
  saveEvents,
  readUsers,
  readBookmarks,
  saveBookmarks,
} from '@/lib/db';
import { validateVenueAndTime } from '@/lib/venueValidation';
import { emitEvent, EVENT_TYPES } from '@/lib/eventBus';

const JWT_SECRET = process.env.JWT_SECRET || 'eventra-secret-key-2026';

/**
 * Helper to get the logged in user inside Server Actions
 * Next.js Unit IV: Session management via cookies()
 */
async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = readUsers();
    return users.find((u) => u.id === decoded.id) || null;
  } catch (err) {
    return null;
  }
}

/**
 * Next.js Server Action: Create Event
 * Next.js Unit III: Server Actions, Form Handling, Data Mutations
 * Next.js Unit II: revalidatePath() for cache invalidation
 */
export async function createEventAction(formData) {
  const user = await getAuthUser();
  if (!user || (user.role !== 'organiser' && user.role !== 'admin')) {
    return { success: false, error: 'Unauthorized: Verified organiser or admin required.' };
  }

  // 1. Extract and validate fields
  const title = (formData.get('title') || '').trim();
  const description = (formData.get('description') || '').trim();
  const category = formData.get('category') || 'General';
  const date = formData.get('date');
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime');
  const venue = formData.get('venue');
  const capacity = Number(formData.get('capacity') || 50);
  const registrationDeadline = formData.get('registrationDeadline') || date;
  const pricing = formData.get('pricing') || 'Free';
  const fee = Number(formData.get('fee') || 0);
  const posterUrl = formData.get('posterUrl') || '';
  const tagsRaw = formData.get('tags') || '';
  const tags = typeof tagsRaw === 'string'
    ? tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  if (!title || !date || !startTime || !endTime || !venue) {
    return { success: false, error: 'Missing required event fields.' };
  }

  // 2. Build event record
  const newEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    description,
    category,
    tags,
    date,
    startTime,
    endTime,
    venue,
    capacity,
    registrationDeadline,
    pricing,
    fee: pricing === 'Paid' ? fee : 0,
    posterUrl,
    status: user.role === 'admin' ? 'Published' : 'Pending Approval',
    organiserId: user.id,
    organiserName: user.name,
    clubName: user.clubName || user.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 3. Validate with Module 4 Clash Engine
  const allEvents = readEvents();
  const validation = validateVenueAndTime(newEvent, allEvents);
  if (!validation.isValid) {
    return { success: false, error: validation.message, clashes: validation.clashes };
  }

  // 4. Save to database
  allEvents.push(newEvent);
  saveEvents(allEvents);

  // 5. Trigger notifications via Event Bus
  if (newEvent.status === 'Published') {
    emitEvent(EVENT_TYPES.EVENT_PUBLISHED, { event: newEvent });
  }

  // 6. Next.js Revalidation
  revalidatePath('/discover');
  revalidatePath('/my-events');
  revalidatePath('/calendar');

  return { success: true, event: newEvent };
}

/**
 * Next.js Server Action: Toggle Event Bookmark
 * Next.js Unit III: Data Mutations & Server Actions
 */
export async function toggleBookmarkAction(eventId) {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: 'Please log in to bookmark events.' };
  }

  const bookmarks = readBookmarks();
  const existingIdx = bookmarks.findIndex(
    (b) => b.userId === user.id && b.eventId === eventId
  );

  let isBookmarked = false;
  if (existingIdx >= 0) {
    bookmarks.splice(existingIdx, 1);
    isBookmarked = false;
  } else {
    bookmarks.push({
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      eventId,
      createdAt: new Date().toISOString(),
    });
    isBookmarked = true;
  }

  saveBookmarks(bookmarks);

  // Revalidate discover feed
  revalidatePath('/discover');
  revalidatePath(`/events/${eventId}`);

  return { success: true, isBookmarked };
}
