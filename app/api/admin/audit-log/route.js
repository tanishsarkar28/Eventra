import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { getAuditLog } from '@/lib/adminEngine';

// GET /api/admin/audit-log
export async function GET(request) {
  const user = await getLoggedInUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }
  const log = getAuditLog();
  return NextResponse.json(log);
}
