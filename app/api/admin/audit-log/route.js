import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { queryAuditLogs } from '@/lib/auditLogger';

/**
 * GET /api/admin/audit-log (and /admin/audit-log via dual-path middleware)
 * 
 * Retrieves the chronological audit trail of all administrator actions,
 * clash overrides, moderation decisions, and venue updates.
 */
export async function GET(request) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const limit = searchParams.get('limit') || 50;

    const logs = queryAuditLogs({ action, targetType, targetId, limit });

    return NextResponse.json(
      {
        success: true,
        count: logs.length,
        logs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /admin/audit-log GET] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve audit log.' },
      { status: 500 }
    );
  }
}
