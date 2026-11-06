import QRCode from 'qrcode';
import {
  readEvents,
  readRegistrations,
  saveRegistrations,
  readWaitlist,
  saveWaitlist,
  readTickets,
  saveTickets,
  readAttendance,
  saveAttendance,
} from './db.js';
import { checkPersonalScheduleClash } from './personalSchedule.js';
import { emitEvent, EVENT_TYPES } from './eventBus.js';
import './notifications.js';

/**
 * Generates a unique, human-readable ticket code.
 * Example: EVT-1004-6058-AB3F
 */
function createTicketCode(eventId, userId) {
  const evtPart = String(eventId).slice(-4);
  const userPart = String(userId).slice(-4);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EVT-${evtPart}-${userPart}-${randomPart}`;
}

/**
 * Generates and stores a ticket with an embedded scannable QR Code.
 */
async function issueTicket({ registrationId, event, user }) {
  const ticketCode = createTicketCode(event.id, user.id);
  const qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
    margin: 1,
    width: 256,
  });

  const ticket = {
    id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketCode,
    registrationId,
    eventId: event.id,
    eventTitle: event.title,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    qrCode: qrCodeDataUrl,
    status: 'Active', // 'Active' | 'Used' | 'Cancelled'
    issuedAt: new Date().toISOString(),
    usedAt: null,
  };

  const tickets = readTickets();
  tickets.push(ticket);
  saveTickets(tickets);

  return ticket;
}

/**
 * Register student for an event.
 * Handles capacity enforcement, waitlist queuing, custom questions, team size,
 * and Module 8 personal schedule clash detection.
 */
export async function registerStudent({
  eventId,
  user,
  teamSize = 1,
  teamMembers = [],
  answers = {},
  allowClash = false,
}) {
  if (!user || !user.id) {
    return { success: false, status: 401, error: 'Authentication required to register.' };
  }

  // 1. Fetch event and verify availability
  const events = readEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    return { success: false, status: 404, error: 'Event not found.' };
  }

  if (event.status !== 'Published') {
    return {
      success: false,
      status: 400,
      error: `Cannot register: Event is currently ${event.status}. Only published events accept registrations.`,
    };
  }

  // 2. Validate registration deadline
  if (event.registrationDeadline) {
    const today = new Date().toISOString().split('T')[0];
    if (today > event.registrationDeadline) {
      return {
        success: false,
        status: 400,
        error: `Registration closed. The deadline was ${event.registrationDeadline}.`,
      };
    }
  }

  // 3. Check for existing active registration or waitlist entry
  const registrations = readRegistrations();
  const existingReg = registrations.find(
    (r) => r.eventId === eventId && r.userId === user.id && r.status === 'Confirmed'
  );
  if (existingReg) {
    return {
      success: false,
      status: 400,
      error: 'You are already registered for this event.',
    };
  }

  const waitlist = readWaitlist();
  const existingWait = waitlist.find(
    (w) => w.eventId === eventId && w.userId === user.id && w.status === 'Waiting'
  );
  if (existingWait) {
    return {
      success: false,
      status: 400,
      error: `You are already on the waitlist for this event at position #${existingWait.position}.`,
      waitlistPosition: existingWait.position,
    };
  }

  // 4. Module 8: Personal Schedule Clash Detection
  if (!allowClash) {
    const clash = checkPersonalScheduleClash(user.id, event);
    if (clash.hasClash) {
      return {
        success: false,
        status: 409,
        isClash: true,
        error: clash.message,
        conflictingEvent: clash.conflictingEvent,
      };
    }
  }

  // 5. Capacity Enforcement
  const confirmedCount = registrations.filter(
    (r) => r.eventId === eventId && r.status === 'Confirmed'
  ).length;

  const capacity = Number(event.capacity) || 100;

  // Case A: Seats available -> Confirm registration & issue Ticket
  if (confirmedCount < capacity) {
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ticket = await issueTicket({ registrationId: regId, event, user });

    const newRegistration = {
      id: regId,
      eventId: event.id,
      eventTitle: event.title,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      status: 'Confirmed',
      teamSize: Number(teamSize) || 1,
      teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
      answers: answers || {},
      registeredAt: new Date().toISOString(),
      cancelledAt: null,
    };

    registrations.push(newRegistration);
    saveRegistrations(registrations);

    // Module 7: Trigger event-driven registration notification
    emitEvent(EVENT_TYPES.REGISTRATION_CONFIRMED, {
      registration: newRegistration,
      ticket,
      event,
      user,
    });

    return {
      success: true,
      status: 'Confirmed',
      registration: newRegistration,
      ticket,
      message: 'Registration successful! Your ticket has been generated.',
    };
  }

  // Case B: Event full -> Queue to Waitlist
  const waitingEntries = waitlist.filter(
    (w) => w.eventId === eventId && w.status === 'Waiting'
  );
  const position = waitingEntries.length + 1;
  const waitId = `wait_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newWaitlistEntry = {
    id: waitId,
    eventId: event.id,
    eventTitle: event.title,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    position,
    status: 'Waiting',
    teamSize: Number(teamSize) || 1,
    teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
    answers: answers || {},
    createdAt: new Date().toISOString(),
    promotedAt: null,
    cancelledAt: null,
  };

  waitlist.push(newWaitlistEntry);
  saveWaitlist(waitlist);

  return {
    success: true,
    status: 'Waitlisted',
    waitlist: newWaitlistEntry,
    position,
    message: `Event is at full capacity (${capacity} seats). You have been added to the waitlist at position #${position}.`,
  };
}

/**
 * Unregister from event (with cancellation window check and automatic waitlist promotion).
 */
export async function unregisterStudent({ eventId, user }) {
  if (!user || !user.id) {
    return { success: false, status: 401, error: 'Authentication required.' };
  }

  const events = readEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    return { success: false, status: 404, error: 'Event not found.' };
  }

  // Cancellation Window check:
  // Must cancel at least `cancellationWindowHours` (default 2h) before event starts
  if (event.date && event.startTime) {
    try {
      const eventDateTime = new Date(`${event.date}T${event.startTime}:00`);
      const windowHours = typeof event.cancellationWindowHours === 'number' ? event.cancellationWindowHours : 2;
      const cancellationDeadline = new Date(eventDateTime.getTime() - windowHours * 60 * 60 * 1000);
      const now = new Date();

      if (now > cancellationDeadline) {
        return {
          success: false,
          status: 400,
          error: `Cancellation window has closed. Registrations can only be cancelled at least ${windowHours} hour(s) before event start.`,
        };
      }
    } catch (e) {
      // ignore date parse errors
    }
  }

  const registrations = readRegistrations();
  const regIndex = registrations.findIndex(
    (r) => r.eventId === eventId && r.userId === user.id && r.status === 'Confirmed'
  );

  const waitlist = readWaitlist();
  const waitIndex = waitlist.findIndex(
    (w) => w.eventId === eventId && w.userId === user.id && w.status === 'Waiting'
  );

  if (regIndex === -1 && waitIndex === -1) {
    return {
      success: false,
      status: 404,
      error: 'No active registration or waitlist entry found for this event.',
    };
  }

  // Case A: Cancelling Confirmed Registration -> Auto-promote from Waitlist
  if (regIndex !== -1) {
    const reg = registrations[regIndex];
    reg.status = 'Cancelled';
    reg.cancelledAt = new Date().toISOString();

    // Invalidate ticket
    const tickets = readTickets();
    const ticket = tickets.find((t) => t.id === reg.ticketId || t.ticketCode === reg.ticketCode);
    if (ticket) {
      ticket.status = 'Cancelled';
      saveTickets(tickets);
    }
    saveRegistrations(registrations);

    // Look for first waiting candidate on Waitlist (FIFO queue)
    const waitingCandidates = waitlist
      .filter((w) => w.eventId === eventId && w.status === 'Waiting')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let autoPromotedInfo = null;

    if (waitingCandidates.length > 0) {
      const candidateToPromote = waitingCandidates[0];
      candidateToPromote.status = 'Promoted';
      candidateToPromote.promotedAt = new Date().toISOString();

      // Issue ticket for newly promoted student
      const promotedRegId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const promotedTicket = await issueTicket({
        registrationId: promotedRegId,
        event,
        user: { id: candidateToPromote.userId, name: candidateToPromote.userName, email: candidateToPromote.userEmail },
      });

      const promotedRegistration = {
        id: promotedRegId,
        eventId: event.id,
        eventTitle: event.title,
        userId: candidateToPromote.userId,
        userName: candidateToPromote.userName,
        userEmail: candidateToPromote.userEmail,
        ticketId: promotedTicket.id,
        ticketCode: promotedTicket.ticketCode,
        status: 'Confirmed',
        teamSize: candidateToPromote.teamSize || 1,
        teamMembers: candidateToPromote.teamMembers || [],
        answers: candidateToPromote.answers || {},
        registeredAt: new Date().toISOString(),
        cancelledAt: null,
      };

      const updatedRegistrations = readRegistrations();
      updatedRegistrations.push(promotedRegistration);
      saveRegistrations(updatedRegistrations);

      // Module 7: Trigger event-driven waitlist promotion alert
      emitEvent(EVENT_TYPES.WAITLIST_PROMOTED, {
        user: { id: candidateToPromote.userId, name: candidateToPromote.userName, email: candidateToPromote.userEmail },
        event,
        registration: promotedRegistration,
        ticket: promotedTicket,
      });

      autoPromotedInfo = {
        userId: candidateToPromote.userId,
        userName: candidateToPromote.userName,
        userEmail: candidateToPromote.userEmail,
        ticketCode: promotedTicket.ticketCode,
      };
    }

    // Recalculate remaining waitlist positions
    let pos = 1;
    for (const w of waitlist) {
      if (w.eventId === eventId && w.status === 'Waiting') {
        w.position = pos++;
      }
    }
    saveWaitlist(waitlist);

    return {
      success: true,
      message: 'Registration successfully cancelled.' + (autoPromotedInfo ? ` Waitlisted student ${autoPromotedInfo.userName} was automatically promoted!` : ''),
      autoPromoted: autoPromotedInfo,
    };
  }

  // Case B: Cancelling Waitlist entry
  if (waitIndex !== -1) {
    const waitEntry = waitlist[waitIndex];
    waitEntry.status = 'Cancelled';
    waitEntry.cancelledAt = new Date().toISOString();

    // Recalculate remaining waitlist positions
    let pos = 1;
    for (const w of waitlist) {
      if (w.eventId === eventId && w.status === 'Waiting') {
        w.position = pos++;
      }
    }
    saveWaitlist(waitlist);

    return {
      success: true,
      message: 'Successfully removed from the waitlist.',
    };
  }
}

/**
 * Scan ticket code for attendee check-in.
 * Validates organiser permissions, verifies ticket validity and marks attendance.
 */
export async function scanAttendance({ ticketCode, eventId, organiserUser }) {
  if (!organiserUser || !organiserUser.id) {
    return { success: false, status: 401, error: 'Authentication required.' };
  }

  if (!ticketCode) {
    return { success: false, status: 400, error: 'Ticket code is required for scan.' };
  }

  const cleanCode = ticketCode.trim().toUpperCase();
  const tickets = readTickets();
  const ticket = tickets.find((t) => t.ticketCode.toUpperCase() === cleanCode);

  if (!ticket) {
    return { success: false, status: 404, error: 'Invalid Ticket: No ticket matching this code found.' };
  }

  // Verify target event match
  if (eventId && ticket.eventId !== eventId) {
    return {
      success: false,
      status: 400,
      error: `Ticket Mismatch: This ticket is for '${ticket.eventTitle}' (${ticket.eventId}), not this event.`,
    };
  }

  // Verify organiser ownership or admin role
  const events = readEvents();
  const event = events.find((e) => e.id === ticket.eventId);
  if (!event) {
    return { success: false, status: 404, error: 'Event associated with ticket not found.' };
  }

  const isOwner = event.organiserId === organiserUser.id;
  const isAdmin = organiserUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    return {
      success: false,
      status: 403,
      error: 'Permission Denied: Only the event organiser or system administrator can scan tickets.',
    };
  }

  // Check ticket state
  if (ticket.status === 'Used') {
    return {
      success: false,
      status: 400,
      alreadyUsed: true,
      error: `Duplicate Scan: Ticket was already used for check-in on ${ticket.usedAt || 'earlier today'}.`,
    };
  }

  if (ticket.status === 'Cancelled') {
    return {
      success: false,
      status: 400,
      error: 'Ticket Void: This registration was cancelled and cannot be checked in.',
    };
  }

  // Mark ticket as Used
  ticket.status = 'Used';
  ticket.usedAt = new Date().toISOString();
  saveTickets(tickets);

  // Record Attendance
  const attendance = readAttendance();
  const attRecord = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId: ticket.eventId,
    eventTitle: ticket.eventTitle,
    ticketId: ticket.id,
    ticketCode: ticket.ticketCode,
    userId: ticket.userId,
    userName: ticket.userName,
    userEmail: ticket.userEmail,
    checkInTime: new Date().toISOString(),
    scannedBy: organiserUser.id,
    scannedByName: organiserUser.name,
    method: 'QR Scan',
    status: 'Checked In',
  };

  attendance.push(attRecord);
  saveAttendance(attendance);

  return {
    success: true,
    message: `Attendance Verified! Welcome, ${ticket.userName}.`,
    attendee: attRecord,
  };
}

/**
 * Retrieve attendees list, waitlist and attendance stats for an event.
 * Supports JSON or CSV export.
 */
export async function getEventAttendees({ eventId, user, format = 'json' }) {
  if (!user || !user.id) {
    return { success: false, status: 401, error: 'Authentication required.' };
  }

  const events = readEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    return { success: false, status: 404, error: 'Event not found.' };
  }

  // Permission check: Organiser owner or Admin
  if (event.organiserId !== user.id && user.role !== 'admin') {
    return { success: false, status: 403, error: 'Access denied: Only event organiser or admin can view attendee list.' };
  }

  const registrations = readRegistrations().filter((r) => r.eventId === eventId);
  const waitlist = readWaitlist().filter((w) => w.eventId === eventId && w.status === 'Waiting');
  const attendance = readAttendance().filter((a) => a.eventId === eventId);
  const tickets = readTickets().filter((t) => t.eventId === eventId);

  // Build merged attendee objects
  const attendees = registrations
    .filter((r) => r.status === 'Confirmed')
    .map((reg) => {
      const att = attendance.find((a) => a.ticketCode === reg.ticketCode || a.userId === reg.userId);
      const ticket = tickets.find((t) => t.id === reg.ticketId || t.ticketCode === reg.ticketCode);
      return {
        registrationId: reg.id,
        ticketCode: reg.ticketCode,
        userId: reg.userId,
        userName: reg.userName,
        userEmail: reg.userEmail,
        teamSize: reg.teamSize || 1,
        teamMembers: reg.teamMembers || [],
        answers: reg.answers || {},
        registeredAt: reg.registeredAt,
        status: reg.status,
        isCheckedIn: Boolean(att),
        checkInTime: att ? att.checkInTime : null,
        ticketStatus: ticket ? ticket.status : 'Active',
      };
    });

  const totalCapacity = Number(event.capacity) || 0;
  const totalRegistered = attendees.length;
  const totalCheckedIn = attendees.filter((a) => a.isCheckedIn).length;
  const totalWaitlist = waitlist.length;
  const attendanceRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  const summary = {
    totalCapacity,
    totalRegistered,
    totalCheckedIn,
    totalWaitlist,
    attendanceRate,
  };

  // If CSV format requested, convert to standard CSV string
  if (format === 'csv') {
    const csvHeaders = [
      'Registration ID',
      'Ticket Code',
      'Student Name',
      'Student Email',
      'Team Size',
      'Registration Status',
      'Attendance Status',
      'Check-In Time',
      'Registered At',
    ];

    const rows = attendees.map((a) => [
      `"${a.registrationId}"`,
      `"${a.ticketCode}"`,
      `"${(a.userName || '').replace(/"/g, '""')}"`,
      `"${(a.userEmail || '').replace(/"/g, '""')}"`,
      a.teamSize,
      `"${a.status}"`,
      `"${a.isCheckedIn ? 'Checked In' : 'Not Checked In'}"`,
      `"${a.checkInTime || 'N/A'}"`,
      `"${a.registeredAt}"`,
    ]);

    const csvContent = [csvHeaders.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return {
      success: true,
      format: 'csv',
      data: csvContent,
      filename: `attendees-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}-${event.id}.csv`,
    };
  }

  return {
    success: true,
    format: 'json',
    event: {
      id: event.id,
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      capacity: event.capacity,
    },
    summary,
    attendees,
    waitlist,
  };
}

/**
 * Get registration and ticket status for the currently logged-in student.
 */
export async function getStudentRegistrationStatus(eventId, userId) {
  if (!userId) {
    return { isRegistered: false, status: null };
  }

  const registrations = readRegistrations();
  const confirmedReg = registrations.find(
    (r) => r.eventId === eventId && r.userId === userId && r.status === 'Confirmed'
  );

  if (confirmedReg) {
    const tickets = readTickets();
    const ticket = tickets.find(
      (t) => t.id === confirmedReg.ticketId || t.ticketCode === confirmedReg.ticketCode
    );

    const attendance = readAttendance();
    const attRecord = attendance.find(
      (a) => a.eventId === eventId && a.userId === userId
    );

    return {
      isRegistered: true,
      status: 'Confirmed',
      registration: confirmedReg,
      ticket: ticket || null,
      isCheckedIn: Boolean(attRecord),
      checkInTime: attRecord ? attRecord.checkInTime : null,
    };
  }

  const waitlist = readWaitlist();
  const waitEntry = waitlist.find(
    (w) => w.eventId === eventId && w.userId === userId && w.status === 'Waiting'
  );

  if (waitEntry) {
    return {
      isRegistered: true,
      status: 'Waitlisted',
      waitlist: waitEntry,
      position: waitEntry.position,
    };
  }

  return { isRegistered: false, status: null };
}
