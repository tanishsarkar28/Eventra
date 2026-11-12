import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getOrganisers, setOrganiserStatus } from '@/lib/adminEngine';

export async function GET(request) {
  const user = await getLoggedInUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  return NextResponse.json(getOrganisers());
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
  const { id, active } = body;
  if (!id) {
    return NextResponse.json({ error: 'Organiser ID is required.' }, { status: 400 });
  }
  const result = setOrganiserStatus(id, Boolean(active), user);
  return NextResponse.json(result);
}
