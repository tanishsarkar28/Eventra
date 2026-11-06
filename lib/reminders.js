import {
  readEvents,
  readRegistrations,
  readNotifications,
} from './db.js';
import { createNotification } from './notifications.js';

/**
 * ============================================================================
 * Module 7: Scheduled Job for Reminders (24h and 1h before)
 * ============================================================================
 * 
 * Purpose:
 * Students get busy with college life and might forget about events they registered for!
 * This scheduled runner acts like a polite alarm clock:
 * 1. 24 Hours Before: "Hey, tomorrow is your event! Pack your bag."
 * 2. 1 Hour Before: "Starting in 60 minutes! Head over to the auditorium right now!"
 * 
 * Deduplication Rule:
 * It checks existing notifications so it NEVER sends the same reminder twice.
 */

/**
 * Checks all upcoming published events and generates 24-hour and 1-hour reminders
 * for registered attendees.
 * 
 * @param {Object} options
 * @param {Date|string} options.referenceDate - Optional timestamp to evaluate against (defaults to now)
 * @returns {Object} { checkedEventsCount, remindersSentCount, reminders }
 */
export function checkAndSendReminders({ referenceDate = new Date() } = {}) {
  const refTime = new Date(referenceDate).getTime();
  const events = readEvents();
  const registrations = readRegistrations();
  const existingNotifications = readNotifications();

  const publishedEvents = events.filter((e) => e.status === 'Published' && e.date && e.startTime);
  const remindersSent = [];

  for (const event of publishedEvents) {
    try {
      // Parse event start time in UTC so comparisons are 100% timezone-independent
      const [year, month, day] = event.date.split('-').map(Number);
      const [hours, minutes] = event.startTime.split(':').map(Number);
      const eventStartTimeMs = Date.UTC(year, month - 1, day, hours, minutes, 0);

      // Skip past events
      if (isNaN(eventStartTimeMs) || eventStartTimeMs < refTime) {
        continue;
      }

      // Difference in hours
      const diffMs = eventStartTimeMs - refTime;
      const diffHours = diffMs / (1000 * 60 * 60);

      // Find all confirmed attendees for this event
      const confirmedAttendees = registrations.filter(
        (r) => r.eventId === event.id && r.status === 'Confirmed'
      );

      if (confirmedAttendees.length === 0) {
        continue;
      }

      // -------------------------------------------------------------
      // Window A: 24-Hour Reminder (Between 1.0 hour and 25.0 hours away)
      // -------------------------------------------------------------
      const is24hDue = diffHours > 1.0 && diffHours <= 25.0;

      // -------------------------------------------------------------
      // Window B: 1-Hour Reminder (Between 0 and 1.5 hours away)
      // -------------------------------------------------------------
      const is1hDue = diffHours > 0 && diffHours <= 1.5;

      for (const attendee of confirmedAttendees) {
        const userId = attendee.userId;

        // Check if 24h reminder is due and not yet sent
        if (is24hDue) {
          const alreadySent24h = existingNotifications.some(
            (n) =>
              n.userId === userId &&
              n.metadata?.eventId === event.id &&
              n.type === 'reminder_24h'
          );

          if (!alreadySent24h) {
            const notif = createNotification({
              userId,
              title: `⏰ 24-Hour Reminder: ${event.title}`,
              message: `Friendly reminder! "${event.title}" starts in 24 hours on ${event.date} at ${event.startTime} in ${event.venue}. Don't forget your digital ticket (${attendee.ticketCode})!`,
              type: 'reminder_24h',
              channels: ['in_app', 'email', 'push'],
              metadata: {
                eventId: event.id,
                eventTitle: event.title,
                ticketCode: attendee.ticketCode,
                date: event.date,
                startTime: event.startTime,
                venue: event.venue,
                hoursUntilStart: Math.round(diffHours),
              },
            });

            if (notif) {
              remindersSent.push(notif);
              existingNotifications.unshift(notif); // keep local cache updated for this run
            }
          }
        }

        // Check if 1h reminder is due and not yet sent
        if (is1hDue) {
          const alreadySent1h = existingNotifications.some(
            (n) =>
              n.userId === userId &&
              n.metadata?.eventId === event.id &&
              n.type === 'reminder_1h'
          );

          if (!alreadySent1h) {
            const notif = createNotification({
              userId,
              title: `🚨 1-Hour Reminder: ${event.title} starts soon!`,
              message: `Starting in less than 1 hour! "${event.title}" kicks off at ${event.startTime} in ${event.venue}. Head over to the venue now!`,
              type: 'reminder_1h',
              channels: ['in_app', 'email', 'push'],
              metadata: {
                eventId: event.id,
                eventTitle: event.title,
                ticketCode: attendee.ticketCode,
                date: event.date,
                startTime: event.startTime,
                venue: event.venue,
                minutesUntilStart: Math.round(diffHours * 60),
              },
            });

            if (notif) {
              remindersSent.push(notif);
              existingNotifications.unshift(notif); // keep local cache updated
            }
          }
        }
      }
    } catch (e) {
      console.error(`[Reminders] Error checking reminders for event ${event.id}:`, e);
    }
  }

  return {
    success: true,
    referenceTime: new Date(refTime).toISOString(),
    checkedEventsCount: publishedEvents.length,
    remindersSentCount: remindersSent.length,
    reminders: remindersSent,
  };
}

// Background scheduler timer instance
const timerKey = Symbol.for('eventra.reminders.timer');

export function startReminderScheduler(intervalMs = 60000) {
  if (globalThis[timerKey]) {
    return; // Already running
  }
  globalThis[timerKey] = setInterval(() => {
    try {
      checkAndSendReminders();
    } catch (e) {
      console.error('[Reminders] Error during interval run:', e);
    }
  }, intervalMs);
}
