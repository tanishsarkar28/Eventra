import { NextResponse } from 'next/server';
import { checkAndSendReminders } from '@/lib/reminders';

/**
 * POST /api/notifications/reminders/run (and /notifications/reminders/run)
 * 
 * Runs the scheduled reminders engine on demand.
 * Accepts optional JSON body: { referenceDate: "2026-11-20T09:00:00Z" }
 * which is invaluable for testing future reminder triggers!
 */
export async function POST(request) {
  try {
    let referenceDate = new Date();

    try {
      const body = await request.json();
      if (body && body.referenceDate) {
        referenceDate = new Date(body.referenceDate);
      }
    } catch (e) {
      // Body may be empty, defaults to current time
    }

    const result = checkAndSendReminders({ referenceDate });

    return NextResponse.json(
      {
        success: true,
        message: `Reminder check executed. ${result.remindersSentCount} reminder(s) generated.`,
        referenceTime: result.referenceTime,
        checkedEventsCount: result.checkedEventsCount,
        remindersSentCount: result.remindersSentCount,
        reminders: result.reminders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /notifications/reminders/run POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute reminder job.' },
      { status: 500 }
    );
  }
}
