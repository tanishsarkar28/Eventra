import { EventEmitter } from 'events';

/**
 * Eventra Event Bus (Singleton)
 * 
 * An event-driven message bus used across the application to trigger notifications,
 * reminders, and cross-module reactions without tightly coupling modules together.
 * 
 * Even a baby can understand it:
 * Think of the Event Bus like a campus megaphone! When something important happens
 * (like a student registering or an event getting published), the megaphone shouts:
 * "Hooray! An event was published!"
 * Everyone listening to that announcement immediately takes action!
 */

// Define standard event constants for type safety and clarity
export const EVENT_TYPES = {
  EVENT_PUBLISHED: 'event:published',
  REGISTRATION_CONFIRMED: 'registration:confirmed',
  ORGANISER_REGISTRATION_ALERT: 'organiser:registration_alert',
  WAITLIST_PROMOTED: 'waitlist:promoted',
  EVENT_UPDATED: 'event:updated',
  EVENT_CANCELLED: 'event:cancelled',
  EVENT_APPROVED: 'event:approved',
  ORGANISER_VERIFIED: 'organiser:verified',
};

// Use globalThis to maintain a single EventEmitter singleton across Next.js reloads
const globalKey = Symbol.for('eventra.eventbus.singleton');

function getEventBus() {
  if (!globalThis[globalKey]) {
    const bus = new EventEmitter();
    bus.setMaxListeners(50); // allow multiple listeners without node warnings
    globalThis[globalKey] = bus;
  }
  return globalThis[globalKey];
}

export const eventBus = getEventBus();

/**
 * Helper to safely emit events without crashing if an error occurs in a listener.
 */
export function emitEvent(eventName, payload) {
  try {
    eventBus.emit(eventName, payload);
    return true;
  } catch (error) {
    console.error(`[EventBus] Error emitting event "${eventName}":`, error);
    return false;
  }
}
