/**
 * Module 8: Personal Calendar & Schedule Integration - Automated Test Suite
 * 
 * Tests:
 * 1. Timetable Slot CRUD and Data Persistence
 * 2. Day of Week & Golden Interval Overlap Math
 * 3. Class Timetable Clash Detection ("Overlaps your DBMS lecture")
 * 4. Registered Event Double-Booking Clash Detection
 * 5. Free-Slot Window Calculation (Campus hours 08:00 - 18:00)
 * 6. .ics iCalendar Export Format (RFC 5545 compliance)
 * 7. End-to-End Registration Integration: registration blocked on lecture clash
 */

import {
  getDayOfWeekFromDate,
  doIntervalsOverlap,
  checkPersonalScheduleClash,
  calculateFreeSlots,
  generateIcsCalendar,
  getStudentSchedule,
} from '../lib/personalSchedule.js';
import {
  readTimetable,
  saveTimetable,
  readEvents,
  saveEvents,
  readRegistrations,
  saveRegistrations,
  readUsers,
  saveUsers,
} from '../lib/db.js';
import { registerStudent } from '../lib/registrationEngine.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runModule8Tests() {
  console.log('\n======================================================');
  console.log('   MODULE 8: PERSONAL CALENDAR & SCHEDULE INTEGRATION  ');
  console.log('======================================================\n');

  // Backup original data to restore after test
  const originalTimetable = readTimetable();
  const originalEvents = readEvents();
  const originalRegistrations = readRegistrations();
  const originalUsers = readUsers();

  try {
    // -----------------------------------------------------------------
    // TEST 1: Golden Interval Overlap Helper
    // -----------------------------------------------------------------
    console.log('--- TEST 1: Interval Overlap Logic ---');
    // Overlapping intervals: 10:00-11:30 and 11:00-12:00
    assert(doIntervalsOverlap('10:00', '11:30', '11:00', '12:00') === true, '10:00-11:30 overlaps 11:00-12:00');
    // Non-overlapping intervals (adjacent): 10:00-11:00 and 11:00-12:00
    assert(doIntervalsOverlap('10:00', '11:00', '11:00', '12:00') === false, 'Adjacent times 10:00-11:00 and 11:00-12:00 do NOT overlap');
    // Non-overlapping (distant): 09:00-10:00 and 14:00-15:00
    assert(doIntervalsOverlap('09:00', '10:00', '14:00', '15:00') === false, 'Separate times do NOT overlap');
    // Enclosed interval: 09:00-17:00 and 10:00-11:00
    assert(doIntervalsOverlap('09:00', '17:00', '10:00', '11:00') === true, 'Sub-interval inside larger interval overlaps');

    // -----------------------------------------------------------------
    // TEST 2: Day of Week Calculation
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Day of Week Calculation ---');
    // 2026-11-12 is a Thursday
    const thursdayDay = getDayOfWeekFromDate('2026-11-12');
    assert(thursdayDay === 'Thursday', `2026-11-12 converts to 'Thursday' (got '${thursdayDay}')`);
    // 2026-11-13 is a Friday
    const fridayDay = getDayOfWeekFromDate('2026-11-13');
    assert(fridayDay === 'Friday', `2026-11-13 converts to 'Friday' (got '${fridayDay}')`);

    // -----------------------------------------------------------------
    // TEST 3: Timetable Slot Persistence & CRUD
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Timetable Slot Persistence ---');
    const testStudentId = 'student_test_m8_001';
    const testSlot = {
      id: 'slot_dbms_thu_10',
      userId: testStudentId,
      subject: 'DBMS Lecture',
      dayOfWeek: 'Thursday',
      startTime: '10:00',
      endTime: '11:00',
      room: 'Lab 3',
      instructor: 'Prof. Sharma',
    };

    saveTimetable([testSlot]);
    const storedSlots = readTimetable();
    assert(storedSlots.length === 1, 'Timetable slot written to disk successfully');
    assert(storedSlots[0].subject === 'DBMS Lecture', 'Slot subject matches');
    assert(storedSlots[0].room === 'Lab 3', 'Slot room matches');

    // -----------------------------------------------------------------
    // TEST 4: Timetable Clash Warning ("Overlaps your DBMS lecture")
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Class Timetable Clash Warning ---');
    // Target Event on Thursday 2026-11-12 from 10:30 to 12:00 (overlaps 10:00-11:00)
    const clashingEvent = {
      id: 'evt_hack_001',
      title: 'Web3 Workshop',
      date: '2026-11-12', // Thursday
      startTime: '10:30',
      endTime: '12:00',
    };

    const clashResult1 = checkPersonalScheduleClash(testStudentId, clashingEvent);
    assert(clashResult1.hasClash === true, 'Clash detected with timetable lecture');
    assert(clashResult1.type === 'timetable', 'Clash type identified as timetable');
    assert(clashResult1.message.includes('DBMS') && clashResult1.message.includes('Lab 3'), `Clash message mentions lecture: "${clashResult1.message}"`);

    // Target Event on Thursday but at non-overlapping time (14:00 to 16:00)
    const nonClashingEvent = {
      id: 'evt_hack_002',
      title: 'Afternoon Coding Meetup',
      date: '2026-11-12', // Thursday
      startTime: '14:00',
      endTime: '16:00',
    };
    const clashResult2 = checkPersonalScheduleClash(testStudentId, nonClashingEvent);
    assert(clashResult2.hasClash === false, 'No clash detected for non-overlapping afternoon event');

    // Target Event on Friday (different day, no class)
    const fridayEvent = {
      id: 'evt_hack_003',
      title: 'Friday Tech Talk',
      date: '2026-11-13', // Friday
      startTime: '10:00',
      endTime: '11:00',
    };
    const clashResult3 = checkPersonalScheduleClash(testStudentId, fridayEvent);
    assert(clashResult3.hasClash === false, 'No clash detected on day with no classes');

    // -----------------------------------------------------------------
    // TEST 5: Registered Event Overlap Clash
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Double-Booking Registered Events Clash ---');
    const existingRegisteredEvent = {
      id: 'evt_robotics_99',
      title: 'Robotics Seminar',
      date: '2026-11-13',
      startTime: '14:00',
      endTime: '16:00',
      status: 'Published',
    };
    saveEvents([existingRegisteredEvent]);
    saveRegistrations([
      {
        id: 'reg_test_001',
        userId: testStudentId,
        eventId: 'evt_robotics_99',
        status: 'Confirmed',
      },
    ]);

    // Another event at the same time on 2026-11-13
    const overlappingRegistered = {
      id: 'evt_ai_100',
      title: 'AI Showcase',
      date: '2026-11-13',
      startTime: '15:00',
      endTime: '17:00',
    };
    const clashResult4 = checkPersonalScheduleClash(testStudentId, overlappingRegistered);
    assert(clashResult4.hasClash === true, 'Clash detected with already registered event');
    assert(clashResult4.type === 'event', 'Clash type identified as event');
    assert(clashResult4.message.includes('Robotics Seminar'), `Message mentions conflicting registered event: "${clashResult4.message}"`);

    // -----------------------------------------------------------------
    // TEST 6: Free Slots Calculation
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Free Slots Calculation ---');
    // Day busy blocks: 10:00-11:00 (DBMS) and 14:00-16:00 (Lab)
    const busyIntervals = [
      { startTime: '10:00', endTime: '11:00', title: 'DBMS' },
      { startTime: '14:00', endTime: '16:00', title: 'Lab' },
    ];
    const freeSlots = calculateFreeSlots(busyIntervals, '08:00', '18:00');
    assert(freeSlots.length === 3, 'Finds 3 free slots during campus hours (08:00 - 18:00)');
    assert(freeSlots[0].startTime === '08:00' && freeSlots[0].endTime === '10:00', 'Slot 1: 08:00 - 10:00 (120 mins)');
    assert(freeSlots[1].startTime === '11:00' && freeSlots[1].endTime === '14:00', 'Slot 2: 11:00 - 14:00 (180 mins)');
    assert(freeSlots[2].startTime === '16:00' && freeSlots[2].endTime === '18:00', 'Slot 3: 16:00 - 18:00 (120 mins)');

    // -----------------------------------------------------------------
    // TEST 7: .ics Calendar Generation (RFC 5545)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: .ics iCalendar Export ---');
    const icsString = generateIcsCalendar({
      user: { name: 'Rishi Student' },
      events: [existingRegisteredEvent],
      timetableSlots: [testSlot],
    });

    assert(icsString.includes('BEGIN:VCALENDAR'), '.ics contains BEGIN:VCALENDAR');
    assert(icsString.includes('END:VCALENDAR'), '.ics contains END:VCALENDAR');
    assert(icsString.includes('SUMMARY:Robotics Seminar'), '.ics contains registered event summary');
    assert(icsString.includes('SUMMARY:Class: DBMS Lecture'), '.ics contains class lecture summary');
    assert(icsString.includes('RRULE:FREQ=WEEKLY;BYDAY=TH'), '.ics contains weekly recurring rule for Thursday lecture');

    // -----------------------------------------------------------------
    // TEST 8: Registration Integration (Module 6 + Module 8)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 8: Registration Integration (Block on Lecture Clash) ---');
    const testUserObj = {
      id: testStudentId,
      name: 'Rishi Student',
      email: 'rishi.student@campus.edu',
      role: 'student',
    };
    saveUsers([...originalUsers, testUserObj]);

    const clashEventToRegister = {
      id: 'evt_thursday_clash_01',
      title: 'Thursday Morning Hack Workshop',
      date: '2026-11-12', // Thursday
      startTime: '10:15',
      endTime: '11:45', // overlaps DBMS 10:00-11:00!
      capacity: 50,
      status: 'Published',
      requiresApproval: false,
    };
    saveEvents([...readEvents(), clashEventToRegister]);

    // Student attempts to register without allowClash
    const regResult = await registerStudent({
      eventId: 'evt_thursday_clash_01',
      user: testUserObj,
      allowClash: false,
    });

    assert(regResult.success === false, 'Registration successfully BLOCKED due to personal timetable clash');
    assert(regResult.status === 409, 'Returns HTTP 409 Conflict status');
    assert(regResult.isClash === true, 'isClash flag is true');
    assert(regResult.error.includes('DBMS'), `Clash error returned to user: "${regResult.error}"`);

  } finally {
    // Restore original data files
    saveTimetable(originalTimetable);
    saveEvents(originalEvents);
    saveRegistrations(originalRegistrations);
    saveUsers(originalUsers);
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runModule8Tests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
