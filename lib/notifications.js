import {
  readNotifications,
  saveNotifications,
  readNotificationPreferences,
  saveNotificationPreferences,
  readEmailOutbox,
  saveEmailOutbox,
  readPushOutbox,
  savePushOutbox,
  readUsers,
  readEvents,
  readRegistrations,
  readWaitlist,
} from './db.js';
import { eventBus, EVENT_TYPES } from './eventBus.js';

/**
 * ============================================================================
 * Module 7: Notifications & Reminders Engine
 * ============================================================================
 * 
 * Purpose: Make sure the signal actually reaches people.
 * 
 * Explaining like you're explaining to a 5-year-old:
 * 1. An Event Happens: A student signs up for a painting workshop.
 * 2. The Whistle Blows: The system rings a bell on the Event Bus.
 * 3. The Postman Checks Preferences: Does the student like emails? Do they like in-app badges?
 * 4. Letters are Delivered:
 *    - In-App: A cute notification appears in their bell icon 🔔.
 *    - Email: A clean email is dropped into their inbox ✉️.
 *    - Push: A mobile ping alert pops up 📱.
 */

// ============================================================================
// 1. Notification Preferences Helpers
// ============================================================================

/**
 * Returns the notification preferences for a specific user.
 * If the user has not set preferences yet, returns friendly default values.
 */
export function getUserPreferences(userId) {
  const allPrefs = readNotificationPreferences();
  const existing = allPrefs.find((p) => p.userId === userId);

  if (existing) {
    return existing;
  }

  // Friendly defaults (everything ON by default so students don't miss events!)
  return {
    userId,
    inApp: true,
    email: true,
    push: true,
    newEventAlerts: true,
    reminders: true,
    statusUpdates: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates a user's notification preferences.
 */
export function saveUserPreferences(userId, updates) {
  const allPrefs = readNotificationPreferences();
  const index = allPrefs.findIndex((p) => p.userId === userId);

  const current = index !== -1 ? allPrefs[index] : getUserPreferences(userId);

  const updated = {
    ...current,
    userId,
    inApp: updates.inApp !== undefined ? Boolean(updates.inApp) : current.inApp,
    email: updates.email !== undefined ? Boolean(updates.email) : current.email,
    push: updates.push !== undefined ? Boolean(updates.push) : current.push,
    newEventAlerts: updates.newEventAlerts !== undefined ? Boolean(updates.newEventAlerts) : current.newEventAlerts,
    reminders: updates.reminders !== undefined ? Boolean(updates.reminders) : current.reminders,
    statusUpdates: updates.statusUpdates !== undefined ? Boolean(updates.statusUpdates) : current.statusUpdates,
    updatedAt: new Date().toISOString(),
  };

  if (index !== -1) {
    allPrefs[index] = updated;
  } else {
    allPrefs.push(updated);
  }

  saveNotificationPreferences(allPrefs);
  return updated;
}

// ============================================================================
// 2. Email & Push Formatting Helpers
// ============================================================================

function generateEmailHtml({ title, message, type, metadata }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .header { background: #2563eb; color: #ffffff; padding: 18px 24px; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 600; }
    .content { padding: 24px; }
    .content h2 { margin-top: 0; font-size: 18px; color: #0f172a; }
    .content p { font-size: 15px; line-height: 1.6; color: #334155; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #dbeafe; color: #1d4ed8; margin-bottom: 12px; }
    .details-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Eventra Campus Alert</h1>
    </div>
    <div class="content">
      <span class="badge">${type.toUpperCase()}</span>
      <h2>${title}</h2>
      <p>${message}</p>
      ${
        metadata && Object.keys(metadata).length > 0
          ? `<div class="details-box">
              <strong>Event Details:</strong><br/>
              ${Object.entries(metadata)
                .map(([k, v]) => `• <b>${k}:</b> ${v}`)
                .join('<br/>')}
            </div>`
          : ''
      }
    </div>
    <div class="footer">
      This is an automated notification from Eventra Campus Event Management.<br/>
      You received this because of your notification settings.
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// 3. Central Dispatcher: createNotification
// ============================================================================

/**
 * Creates and dispatches a notification across the requested channels
 * while respecting the recipient's personal notification preferences.
 */
export function createNotification({
  userId,
  title,
  message,
  type = 'general',
  channels = ['in_app', 'email', 'push'],
  metadata = {},
}) {
  if (!userId || !title || !message) {
    return null;
  }

  // 1. Fetch user preferences
  const prefs = getUserPreferences(userId);

  // 2. Check alert category filters
  if (type === 'new_event' && prefs.newEventAlerts === false) {
    return null; // Suppressed by user preference
  }
  if ((type === 'reminder_24h' || type === 'reminder_1h') && prefs.reminders === false) {
    return null; // Suppressed by user preference
  }
  if (
    (type === 'venue_change' || type === 'schedule_change' || type === 'event_cancelled') &&
    prefs.statusUpdates === false
  ) {
    return null; // Suppressed by user preference
  }

  // 3. Determine active channels based on preferences
  const activeChannels = [];
  if (channels.includes('in_app') && prefs.inApp !== false) {
    activeChannels.push('in_app');
  }
  if (channels.includes('email') && prefs.email !== false) {
    activeChannels.push('email');
  }
  if (channels.includes('push') && prefs.push !== false) {
    activeChannels.push('push');
  }

  // If user opted out of all requested channels, skip
  if (activeChannels.length === 0) {
    return null;
  }

  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // 4. Create Notification record
  const notification = {
    id: notificationId,
    userId,
    title,
    message,
    type,
    channels: activeChannels,
    isRead: false,
    readAt: null,
    metadata: metadata || {},
    createdAt: now,
  };

  // 5. In-App Channel Delivery (data/notifications.json)
  if (activeChannels.includes('in_app')) {
    const notifications = readNotifications();
    notifications.unshift(notification); // newest first
    saveNotifications(notifications);
  }

  // 6. Look up recipient's email/info for simulated outboxes
  const users = readUsers();
  const recipientUser = users.find((u) => u.id === userId);
  const recipientEmail = recipientUser ? recipientUser.email : `${userId}@campus.edu`;

  // 7. Email Channel Delivery (data/email_outbox.json)
  if (activeChannels.includes('email')) {
    const emailOutbox = readEmailOutbox();
    const emailRecord = {
      id: `em_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notificationId: notification.id,
      to: recipientEmail,
      subject: title,
      text: message,
      html: generateEmailHtml({ title, message, type, metadata }),
      type,
      sentAt: now,
      status: 'Delivered',
    };
    emailOutbox.unshift(emailRecord);
    saveEmailOutbox(emailOutbox);
  }

  // 8. Push Channel Delivery (data/push_outbox.json)
  if (activeChannels.includes('push')) {
    const pushOutbox = readPushOutbox();
    const pushRecord = {
      id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notificationId: notification.id,
      userId,
      title,
      body: message,
      payload: {
        type,
        ...metadata,
      },
      sentAt: now,
      status: 'Sent',
    };
    pushOutbox.unshift(pushRecord);
    savePushOutbox(pushOutbox);
  }

  return notification;
}

// ============================================================================
// 4. Feature Handlers (Event Reactions)
// ============================================================================

/**
 * Feature 1: New-event alerts matched to student interests.
 * Triggered when an event is published.
 */
export function handleEventPublished({ event }) {
  if (!event || event.status !== 'Published') return [];

  const users = readUsers();
  const students = users.filter((u) => u.role === 'student');

  const createdNotifications = [];
  const eventCategory = (event.category || '').toLowerCase();
  const eventTags = Array.isArray(event.tags)
    ? event.tags.map((t) => String(t).toLowerCase())
    : [];

  for (const student of students) {
    const studentInterests = Array.isArray(student.interests)
      ? student.interests.map((i) => String(i).toLowerCase())
      : [];

    // Check if any student interest matches event category or event tags
    const hasInterestMatch = studentInterests.some((interest) => {
      if (eventCategory.includes(interest) || interest.includes(eventCategory)) {
        return true;
      }
      return eventTags.some((tag) => tag.includes(interest) || interest.includes(tag));
    });

    if (hasInterestMatch) {
      const notif = createNotification({
        userId: student.id,
        title: `📢 New Event for You: ${event.title}`,
        message: `A new event matching your interests (${event.category}) has been published: "${event.title}" on ${event.date} at ${event.venue}. Seats are limited (${event.capacity})!`,
        type: 'new_event',
        channels: ['in_app', 'email', 'push'],
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          category: event.category,
          venue: event.venue,
          date: event.date,
        },
      });

      if (notif) createdNotifications.push(notif);
    }
  }

  return createdNotifications;
}

/**
 * Feature 2: Registration confirmation for attendee.
 * Triggered when a student registers with a confirmed seat.
 */
export function handleRegistrationConfirmed({ registration, ticket, event, user }) {
  if (!registration || !event) return null;

  const ticketCode = ticket?.ticketCode || registration.ticketCode || 'TICKET-PENDING';

  return createNotification({
    userId: registration.userId,
    title: `🎟️ Registration Confirmed: ${event.title}`,
    message: `You're all set! Your registration for "${event.title}" is confirmed. Ticket Code: ${ticketCode}. Venue: ${event.venue} on ${event.date} at ${event.startTime}.`,
    type: 'registration_confirmation',
    channels: ['in_app', 'email', 'push'],
    metadata: {
      eventId: event.id,
      eventTitle: event.title,
      ticketCode,
      venue: event.venue,
      date: event.date,
      startTime: event.startTime,
    },
  });
}

/**
 * Feature 6A: Organiser alert for new registration.
 * Triggered when an attendee confirms registration.
 */
export function handleOrganiserRegistrationAlert({ event, user, registration }) {
  if (!event || !event.organiserId || !user) return null;

  return createNotification({
    userId: event.organiserId,
    title: `👤 New Attendee Registered: ${event.title}`,
    message: `${user.name} (${user.email}) just registered for "${event.title}". Ticket code: ${registration.ticketCode}.`,
    type: 'organiser_registration',
    channels: ['in_app', 'email', 'push'],
    metadata: {
      eventId: event.id,
      eventTitle: event.title,
      attendeeName: user.name,
      attendeeEmail: user.email,
      ticketCode: registration.ticketCode,
    },
  });
}

/**
 * Feature 5: Waitlist promotion alert.
 * Triggered when a spot opens up and a waitlisted student is auto-promoted.
 */
export function handleWaitlistPromoted({ user, event, registration, ticket }) {
  if (!user || !event) return null;

  const ticketCode = ticket?.ticketCode || registration?.ticketCode || 'TICKET-ISSUED';

  return createNotification({
    userId: user.id || user.userId,
    title: `🎉 Promoted from Waitlist: ${event.title}`,
    message: `Great news! A seat just opened up and you have been automatically promoted from the waitlist for "${event.title}". Your digital ticket (${ticketCode}) is confirmed!`,
    type: 'waitlist_promotion',
    channels: ['in_app', 'email', 'push'],
    metadata: {
      eventId: event.id,
      eventTitle: event.title,
      ticketCode,
      venue: event.venue,
      date: event.date,
      startTime: event.startTime,
    },
  });
}

/**
 * Feature 4A: Change alert (venue change, date/time update, or general modification).
 * Triggered when an event is updated.
 */
export function handleEventUpdated({ event, previousEvent, changes }) {
  if (!event) return [];

  // Determine what type of change took place
  const venueChanged = previousEvent && previousEvent.venue && previousEvent.venue !== event.venue;
  const scheduleChanged =
    previousEvent &&
    (previousEvent.date !== event.date ||
      previousEvent.startTime !== event.startTime ||
      previousEvent.endTime !== event.endTime);

  let type = 'event_updated';
  let title = `📢 Event Updated: ${event.title}`;
  let message = `Details for "${event.title}" have been updated. Please review your event pass.`;

  if (venueChanged) {
    type = 'venue_change';
    title = `📍 Venue Changed: ${event.title}`;
    message = `Important location notice! The venue for "${event.title}" was moved from ${previousEvent.venue} to ${event.venue}.`;
  } else if (scheduleChanged) {
    type = 'schedule_change';
    title = `⏰ Schedule Updated: ${event.title}`;
    message = `The date/time for "${event.title}" was updated: Now on ${event.date} from ${event.startTime} to ${event.endTime} at ${event.venue}.`;
  }

  // Find all confirmed registrants and waitlisted students
  const registrations = readRegistrations().filter(
    (r) => r.eventId === event.id && r.status === 'Confirmed'
  );
  const waitlist = readWaitlist().filter(
    (w) => w.eventId === event.id && w.status === 'Waiting'
  );

  const recipientIds = new Set([
    ...registrations.map((r) => r.userId),
    ...waitlist.map((w) => w.userId),
  ]);

  const createdNotifications = [];
  for (const userId of recipientIds) {
    const notif = createNotification({
      userId,
      title,
      message,
      type,
      channels: ['in_app', 'email', 'push'],
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        oldVenue: previousEvent?.venue,
        newVenue: event.venue,
        date: event.date,
        startTime: event.startTime,
      },
    });
    if (notif) createdNotifications.push(notif);
  }

  return createdNotifications;
}

/**
 * Feature 4B: Cancellation alert.
 * Triggered when an event is cancelled.
 */
export function handleEventCancelled({ event }) {
  if (!event) return [];

  const registrations = readRegistrations().filter(
    (r) => r.eventId === event.id && r.status === 'Confirmed'
  );
  const waitlist = readWaitlist().filter(
    (w) => w.eventId === event.id && w.status === 'Waiting'
  );

  const recipientIds = new Set([
    ...registrations.map((r) => r.userId),
    ...waitlist.map((w) => w.userId),
  ]);

  const createdNotifications = [];
  for (const userId of recipientIds) {
    const notif = createNotification({
      userId,
      title: `❌ Event Cancelled: ${event.title}`,
      message: `We regret to inform you that "${event.title}" scheduled for ${event.date} at ${event.venue} has been cancelled.`,
      type: 'event_cancelled',
      channels: ['in_app', 'email', 'push'],
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        date: event.date,
        venue: event.venue,
      },
    });
    if (notif) createdNotifications.push(notif);
  }

  return createdNotifications;
}

/**
 * Feature 6B: Organiser alert for event approval / publishing.
 */
export function handleEventApproved({ event, approver }) {
  if (!event || !event.organiserId) return null;

  return createNotification({
    userId: event.organiserId,
    title: `✅ Event Approved & Published: ${event.title}`,
    message: `Congratulations! Your event "${event.title}" was approved by administrator and is now live on the campus discovery feed!`,
    type: 'event_approval',
    channels: ['in_app', 'email', 'push'],
    metadata: {
      eventId: event.id,
      eventTitle: event.title,
      approverName: approver?.name || 'Administrator',
    },
  });
}

/**
 * Feature 6C: Organiser account verification alert.
 */
export function handleOrganiserVerified({ organiser }) {
  if (!organiser || !organiser.id) return null;

  return createNotification({
    userId: organiser.id,
    title: `🎉 Organiser Account Verified!`,
    message: `Your club organiser account (${organiser.clubName || organiser.name}) has been verified by the administrator. You can now create events and book campus venues!`,
    type: 'organiser_verified',
    channels: ['in_app', 'email', 'push'],
    metadata: {
      clubName: organiser.clubName,
    },
  });
}

// ============================================================================
// 5. Wire Up Event Bus Listeners (Event-Driven Architecture)
// ============================================================================

// Prevent duplicate event listener registration in hot-reloading
const listenersRegisteredKey = Symbol.for('eventra.listeners.registered');

if (!globalThis[listenersRegisteredKey]) {
  eventBus.on(EVENT_TYPES.EVENT_PUBLISHED, (payload) => {
    handleEventPublished(payload);
  });

  eventBus.on(EVENT_TYPES.REGISTRATION_CONFIRMED, (payload) => {
    handleRegistrationConfirmed(payload);
    handleOrganiserRegistrationAlert(payload);
  });

  eventBus.on(EVENT_TYPES.ORGANISER_REGISTRATION_ALERT, (payload) => {
    handleOrganiserRegistrationAlert(payload);
  });

  eventBus.on(EVENT_TYPES.WAITLIST_PROMOTED, (payload) => {
    handleWaitlistPromoted(payload);
  });

  eventBus.on(EVENT_TYPES.EVENT_UPDATED, (payload) => {
    handleEventUpdated(payload);
  });

  eventBus.on(EVENT_TYPES.EVENT_CANCELLED, (payload) => {
    handleEventCancelled(payload);
  });

  eventBus.on(EVENT_TYPES.EVENT_APPROVED, (payload) => {
    handleEventApproved(payload);
  });

  eventBus.on(EVENT_TYPES.ORGANISER_VERIFIED, (payload) => {
    handleOrganiserVerified(payload);
  });

  globalThis[listenersRegisteredKey] = true;
}
