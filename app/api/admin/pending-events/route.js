import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getPendingEvents } from '@/lib/adminEngine';

// GET /api/admin/pending-events
export async function GET(request) {
  const user = await getLoggedInUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  const pending = getPendingEvents();
  return NextResponse.json(pending);
}
