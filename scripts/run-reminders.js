/**
 * CLI runner for Module 7 Scheduled Reminders
 * 
 * Usage:
 *   node scripts/run-reminders.js
 *   node scripts/run-reminders.js --date 2026-11-20T09:00:00Z
 */

(async function main() {
  const { checkAndSendReminders } = await import('../lib/reminders.js');

  let referenceDate = new Date();
  const dateArgIdx = process.argv.indexOf('--date');
  if (dateArgIdx !== -1 && process.argv[dateArgIdx + 1]) {
    referenceDate = new Date(process.argv[dateArgIdx + 1]);
  }

  console.log(`[Eventra Reminders] Running check at reference time: ${referenceDate.toISOString()}`);
  const result = checkAndSendReminders({ referenceDate });
  console.log(`[Eventra Reminders] Completed.`);
  console.log(`- Published Events Checked: ${result.checkedEventsCount}`);
  console.log(`- Reminders Sent: ${result.remindersSentCount}`);
  if (result.reminders && result.reminders.length > 0) {
    console.log('\nGenerated Reminders:');
    result.reminders.forEach((r, idx) => {
      console.log(`  ${idx + 1}. [${r.type}] To User: ${r.userId} - "${r.title}"`);
    });
  }
})();
