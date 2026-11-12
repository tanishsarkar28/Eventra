import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { approveEvent, rejectEvent, overrideClash } from '@/lib/adminEngine';

// PATCH /api/admin/events/:id/approve
// Body: { action: "approve" } or { action: "reject", reason: "..." } or { action: "overrideClash", reason: "..." }
export async function PATCH(request, { params }) {
  const user = await getLoggedInUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { id } = params;
  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    body = {};
  }

  const { action, reason } = body;
  let result;
  if (action === 'approve') {
    result = approveEvent(id, user);
  } else if (action === 'reject') {
    result = rejectEvent(id, reason || 'No reason supplied', user);
  } else if (action === 'overrideClash') {
    result = overrideClash(id, user, reason || 'Administrative override');
  } else {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  return NextResponse.json(result);
}
