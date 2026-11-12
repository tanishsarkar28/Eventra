import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getVenues, upsertVenue, deleteVenue } from '@/lib/adminEngine';

export async function GET(request) {
  const user = await getLoggedInUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  return NextResponse.json(getVenues());
}

export async function POST(request) {
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
  if (!body.title) {
    return NextResponse.json({ error: 'Venue title is required.' }, { status: 400 });
  }
  body.id = body.id || `v_${Date.now()}`;
  upsertVenue(body, user);
  return NextResponse.json({ success: true, venue: body });
}

export async function PUT(request) {
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
  if (!body.id) {
    return NextResponse.json({ error: 'Venue ID is required.' }, { status: 400 });
  }
  upsertVenue(body, user);
  return NextResponse.json({ success: true, venue: body });
}

export async function DELETE(request) {
  const user = await getLoggedInUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Venue ID is required.' }, { status: 400 });
  }
  deleteVenue(id, user);
  return NextResponse.json({ success: true });
}
