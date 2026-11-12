import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getAnalytics } from '@/lib/adminEngine';

// GET /api/admin/analytics
export async function GET(request) {
  const user = await getLoggedInUser(request);
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  const snapshot = getAnalytics();
  return NextResponse.json(snapshot);
}
