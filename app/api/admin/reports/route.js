import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getReports, resolveReport, reportEvent } from '@/lib/adminEngine';

export async function GET(request) {
  const user = await getLoggedInUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  return NextResponse.json(getReports());
}

export async function POST(request) {
  const user = await getLoggedInUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    body = {};
  }
  const { eventId, reason } = body;
  if (!eventId || !reason) {
    return NextResponse.json({ error: 'Event ID and reason are required.' }, { status: 400 });
  }
  const rep = reportEvent(eventId, user, reason);
  return NextResponse.json({ success: true, report: rep });
}

export async function PATCH(request) {
  const user = await getLoggedInUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    body = {};
  }
  const { id, action } = body;
  if (!id || !['resolve', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: 'Valid report ID and action (resolve/dismiss) required.' }, { status: 400 });
  }
  const resolution = action === 'dismiss' ? 'Dismissed' : 'Resolved';
  const result = resolveReport(id, user, resolution);
  return NextResponse.json(result);
}
