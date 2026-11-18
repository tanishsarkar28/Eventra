import {
  readEvents,
  readVenues,
  readBookings,
  readRegistrations,
  readAttendance,
  readUsers,
  readCategories,
  readBookmarks,
  readReports,
  readAuditLogs,
  saveAnalyticsSnapshots,
  readAnalyticsSnapshots,
} from './db.js';
import { generateSystemClashReport } from './clashEngine.js';

/**
 * ============================================================================
 * Module 9: Analytics & Insights Calculation Engine
 * ============================================================================
 * 
 * Purpose:
 * Transforms raw campus event, registration, venue booking, and clash data
 * into executive-level insight metrics for administrators.
 * 
 * Explaining like you're explaining to a 5-year-old:
 * Imagine a big sports day at school 🏅. The principal wants to know:
 * 1. How many races did we run each week? (Events per week)
 * 2. Was the playground full or sitting empty? (Venue utilisation)
 * 3. Did all the kids who signed up actually show up? (Registration vs Attendance)
 * 4. Did kids prefer football or painting? (Popular categories)
 * 5. How many times did two teams try to use the same field at once? (Clash frequency)
 */

/**
 * Calculates ISO week number and key for a date string (YYYY-Www).
 */
function getWeekKey(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown';
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  } catch (e) {
    return 'Unknown';
  }
}

/**
 * Helper to compute duration in decimal hours between HH:MM strings.
 */
function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  try {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const diffMin = h2 * 60 + m2 - (h1 * 60 + m1);
    return diffMin > 0 ? Number((diffMin / 60).toFixed(2)) : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Computes the 5 core Module 9 analytics metrics + executive KPI summary.
 */
export function computeAnalytics() {
  const events = readEvents();
  const venues = readVenues();
  const bookings = readBookings();
  const registrations = readRegistrations();
  const attendance = readAttendance();
  const users = readUsers();
  const categories = readCategories();
  const bookmarks = readBookmarks();
  const reports = readReports();
  const auditLogs = readAuditLogs();

  // =========================================================================
  // Metric 1: Events Per Week
  // =========================================================================
  const weeklyMap = {};
  for (const event of events) {
    if (!event.date) continue;
    const week = getWeekKey(event.date);
    if (!weeklyMap[week]) {
      weeklyMap[week] = {
        week,
        totalEvents: 0,
        published: 0,
        pending: 0,
        draft: 0,
        cancelled: 0,
      };
    }
    weeklyMap[week].totalEvents++;
    if (event.status === 'Published') weeklyMap[week].published++;
    else if (event.status === 'Pending Approval') weeklyMap[week].pending++;
    else if (event.status === 'Draft') weeklyMap[week].draft++;
    else if (event.status === 'Cancelled') weeklyMap[week].cancelled++;
  }

  const eventsPerWeek = Object.values(weeklyMap).sort((a, b) => a.week.localeCompare(b.week));

  // =========================================================================
  // Metric 2: Venue Utilisation
  // Formula: (Total Booked Hours / Total Available Operating Hours) * 100%
  // =========================================================================
  const venueUtilisation = venues.map((venue) => {
    // 1. Calculate standard weekly available operating hours
    const dailyHours = calculateHours(venue.availableFrom || '08:00', venue.availableTo || '20:00');
    const operatingDaysCount = Array.isArray(venue.availableDays) ? venue.availableDays.length : 6;
    const weeklyAvailableHours = dailyHours * operatingDaysCount;

    // 2. Calculate booked hours from venue bookings and published events
    const venueBookings = bookings.filter(
      (b) => b.venueId === venue.id && (b.status === 'Approved' || b.status === 'Confirmed')
    );
    const bookedHours = venueBookings.reduce(
      (sum, b) => sum + calculateHours(b.startTime, b.endTime),
      0
    );

    // Published events mapped to this venue
    const venueEvents = events.filter(
      (e) => (e.venue || '').toLowerCase() === (venue.name || '').toLowerCase() && e.status === 'Published'
    );
    const eventHours = venueEvents.reduce(
      (sum, e) => sum + calculateHours(e.startTime, e.endTime),
      0
    );

    const totalOccupiedHours = Number(Math.max(bookedHours, eventHours).toFixed(2));
    const assumedBenchmarkCapacityHours = weeklyAvailableHours * 4; // monthly benchmark (4 weeks)

    const utilisationPercentage = assumedBenchmarkCapacityHours > 0
      ? Number(Math.min(100, (totalOccupiedHours / assumedBenchmarkCapacityHours) * 100).toFixed(1))
      : 0;

    return {
      venueId: venue.id,
      venueName: venue.name,
      type: venue.type,
      capacity: venue.capacity,
      dailyOperatingHours: dailyHours,
      operatingDaysPerWeek: operatingDaysCount,
      totalOccupiedHours,
      benchmarkAvailableHours: assumedBenchmarkCapacityHours,
      utilisationPercentage,
      status: utilisationPercentage > 75 ? 'High Demand' : utilisationPercentage > 30 ? 'Moderate' : 'Available',
    };
  });

  // Overall campus venue utilisation average
  const totalOccupiedCampusHours = venueUtilisation.reduce((sum, v) => sum + v.totalOccupiedHours, 0);
  const totalAvailableCampusHours = venueUtilisation.reduce((sum, v) => sum + v.benchmarkAvailableHours, 0);
  const campusVenueUtilisationRate = totalAvailableCampusHours > 0
    ? Number(((totalOccupiedCampusHours / totalAvailableCampusHours) * 100).toFixed(1))
    : 0;

  // =========================================================================
  // Metric 3: Registration vs Attendance Rate
  // Formula: (Checked In Attendees / Confirmed Registrations) * 100%
  // =========================================================================
  const confirmedRegistrations = registrations.filter((r) => r.status === 'Confirmed');
  const totalConfirmedRegistrations = confirmedRegistrations.length;
  const totalCheckedInAttendees = attendance.length;

  const overallAttendanceRate = totalConfirmedRegistrations > 0
    ? Number(((totalCheckedInAttendees / totalConfirmedRegistrations) * 100).toFixed(1))
    : 0;

  const noShowRate = Number(Math.max(0, 100 - overallAttendanceRate).toFixed(1));

  // Per-event registration vs attendance breakdown
  const eventAttendanceBreakdown = events
    .filter((e) => e.status === 'Published')
    .map((e) => {
      const eventRegs = registrations.filter((r) => r.eventId === e.id && r.status === 'Confirmed');
      const eventAtts = attendance.filter((a) => a.eventId === e.id);
      const regCount = eventRegs.length;
      const attCount = eventAtts.length;
      const rate = regCount > 0 ? Number(((attCount / regCount) * 100).toFixed(1)) : 0;
      return {
        eventId: e.id,
        eventTitle: e.title,
        venue: e.venue,
        capacity: e.capacity,
        confirmedRegistrations: regCount,
        checkedInAttendees: attCount,
        attendanceRate: rate,
      };
    });

  // =========================================================================
  // Metric 4: Popular Categories
  // =========================================================================
  const categoryMap = {};

  // Initialize with standard categories
  for (const cat of categories) {
    categoryMap[cat] = {
      category: cat,
      eventCount: 0,
      publishedCount: 0,
      totalRegistrations: 0,
      totalBookmarks: 0,
    };
  }

  for (const event of events) {
    const cat = event.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        category: cat,
        eventCount: 0,
        publishedCount: 0,
        totalRegistrations: 0,
        totalBookmarks: 0,
      };
    }
    categoryMap[cat].eventCount++;
    if (event.status === 'Published') categoryMap[cat].publishedCount++;

    // Add registrations
    const regCount = registrations.filter((r) => r.eventId === event.id && r.status === 'Confirmed').length;
    categoryMap[cat].totalRegistrations += regCount;

    // Add bookmarks
    const bmCount = bookmarks.filter((b) => b.eventId === event.id).length;
    categoryMap[cat].totalBookmarks += bmCount;
  }

  const popularCategories = Object.values(categoryMap)
    .map((c) => ({
      ...c,
      avgRegistrationsPerEvent: c.eventCount > 0 ? Number((c.totalRegistrations / c.eventCount).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalRegistrations - a.totalRegistrations || b.eventCount - a.eventCount);

  // =========================================================================
  // Metric 5: Clash Frequency
  // =========================================================================
  let clashReport = null;
  try {
    clashReport = generateSystemClashReport();
  } catch (e) {
    clashReport = {
      totalEventsChecked: events.length,
      totalClashesFound: 0,
      breakdownByType: {
        venueClashes: 0,
        capacityClashes: 0,
        organiserClashes: 0,
        audienceClashes: 0,
        blackoutClashes: 0,
      },
    };
  }

  const totalClashes = clashReport?.totalClashesFound || 0;
  const totalAuditedEvents = clashReport?.totalEventsChecked || events.length;
  const clashRate = totalAuditedEvents > 0
    ? Number(((totalClashes / totalAuditedEvents) * 100).toFixed(1))
    : 0;

  const clashFrequency = {
    totalClashesDetected: totalClashes,
    totalAuditedEvents,
    clashRatePercentage: clashRate,
    breakdownByType: clashReport?.breakdownByType || {
      venueClashes: 0,
      capacityClashes: 0,
      organiserClashes: 0,
      audienceClashes: 0,
      blackoutClashes: 0,
    },
  };

  // =========================================================================
  // Executive Overview KPIs
  // =========================================================================
  const pendingApprovalsCount = events.filter((e) => e.status === 'Pending Approval').length;
  const pendingReportsCount = reports.filter((r) => r.status === 'Pending').length;
  const unverifiedOrganisersCount = users.filter((u) => u.role === 'organiser' && !u.isVerified).length;

  const overview = {
    totalEvents: events.length,
    publishedEvents: events.filter((e) => e.status === 'Published').length,
    pendingApprovals: pendingApprovalsCount,
    draftEvents: events.filter((e) => e.status === 'Draft').length,
    cancelledEvents: events.filter((e) => e.status === 'Cancelled').length,
    totalUsers: users.length,
    studentsCount: users.filter((u) => u.role === 'student').length,
    organisersCount: users.filter((u) => u.role === 'organiser').length,
    unverifiedOrganisers: unverifiedOrganisersCount,
    totalVenues: venues.length,
    activeVenues: venues.filter((v) => v.isActive !== false).length,
    totalRegistrations: totalConfirmedRegistrations,
    totalAttendance: totalCheckedInAttendees,
    overallAttendanceRate,
    campusVenueUtilisationRate,
    totalReports: reports.length,
    pendingReports: pendingReportsCount,
    totalAuditLogs: auditLogs.length,
    generatedAt: new Date().toISOString(),
  };

  const snapshot = {
    overview,
    eventsPerWeek,
    venueUtilisation,
    registrationVsAttendance: {
      totalConfirmedRegistrations,
      totalCheckedInAttendees,
      overallAttendanceRate,
      noShowRate,
      eventBreakdown: eventAttendanceBreakdown,
    },
    popularCategories,
    clashFrequency,
  };

  // Save historical snapshot (keep last 30 snapshots)
  try {
    const snapshots = readAnalyticsSnapshots();
    snapshots.unshift({
      id: `snap_${Date.now()}`,
      timestamp: overview.generatedAt,
      overview,
    });
    if (snapshots.length > 30) snapshots.length = 30;
    saveAnalyticsSnapshots(snapshots);
  } catch (e) {
    // ignore snapshot save error
  }

  return snapshot;
}
