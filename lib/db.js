import fs from 'fs';
import path from 'path';

// 1. define path to the data/users.json file
const dataFilePath = path.join(process.cwd(), 'data', 'users.json');

// 2. read all users from users.json file
export function readUsers() {
  try {
    // if file does not exist, return an empty list
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }

    // read the file as plain text
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');

    // parse text into javascript array
    const users = JSON.parse(fileContent);
    return users;
  } catch (error) {
    // if any error happens, return an empty list
    return [];
  }
}

// 3. save all users into users.json file
export function saveUsers(users) {
  // make sure data folder exists
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // convert users array into nicely formatted JSON text
  const fileContent = JSON.stringify(users, null, 2);

  // write the text into the file
  fs.writeFileSync(dataFilePath, fileContent, 'utf-8');
}

// 4. define path to data/events.json file
const eventsFilePath = path.join(process.cwd(), 'data', 'events.json');

// 5. read all events from events.json file
export function readEvents() {
  try {
    if (!fs.existsSync(eventsFilePath)) {
      return [];
    }
    const fileContent = fs.readFileSync(eventsFilePath, 'utf-8');
    const events = JSON.parse(fileContent);
    return events;
  } catch (error) {
    return [];
  }
}

// 6. save all events into events.json file
export function saveEvents(events) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const fileContent = JSON.stringify(events, null, 2);
  fs.writeFileSync(eventsFilePath, fileContent, 'utf-8');
}

// 7. define path to data/categories.json file
const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json');

// 8. read all categories from categories.json file
export function readCategories() {
  try {
    if (!fs.existsSync(categoriesFilePath)) {
      return ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar'];
    }
    const fileContent = fs.readFileSync(categoriesFilePath, 'utf-8');
    const categories = JSON.parse(fileContent);
    return categories;
  } catch (error) {
    return ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar'];
  }
}

// 9. save categories into categories.json file
export function saveCategories(categories) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const fileContent = JSON.stringify(categories, null, 2);
  fs.writeFileSync(categoriesFilePath, fileContent, 'utf-8');
}

// 10. define path to data/tags.json file
const tagsFilePath = path.join(process.cwd(), 'data', 'tags.json');

// 11. read all tags from tags.json file
export function readTags() {
  try {
    if (!fs.existsSync(tagsFilePath)) {
      return ['coding', 'web', 'hackathon', 'robotics', 'dance', 'music', 'gaming', 'quiz', 'sports', 'ai'];
    }
    const fileContent = fs.readFileSync(tagsFilePath, 'utf-8');
    const tags = JSON.parse(fileContent);
    return tags;
  } catch (error) {
    return ['coding', 'web', 'hackathon', 'robotics', 'dance', 'music', 'gaming', 'quiz', 'sports', 'ai'];
  }
}

// 12. save tags into tags.json file
export function saveTags(tags) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const fileContent = JSON.stringify(tags, null, 2);
  fs.writeFileSync(tagsFilePath, fileContent, 'utf-8');
}

// ============================================================
// Module 3: Venue Management - Data Access Functions
// ============================================================

// 13. define path to data/venues.json file
const venuesFilePath = path.join(process.cwd(), 'data', 'venues.json');

// 14. read all venues from venues.json file
export function readVenues() {
  try {
    if (!fs.existsSync(venuesFilePath)) {
      return [];
    }
    const fileContent = fs.readFileSync(venuesFilePath, 'utf-8');
    const venues = JSON.parse(fileContent);
    return venues;
  } catch (error) {
    return [];
  }
}

// 15. save all venues into venues.json file
export function saveVenues(venues) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const fileContent = JSON.stringify(venues, null, 2);
  fs.writeFileSync(venuesFilePath, fileContent, 'utf-8');
}

// 16. define path to data/bookings.json file
const bookingsFilePath = path.join(process.cwd(), 'data', 'bookings.json');

// 17. read all bookings from bookings.json file
export function readBookings() {
  try {
    if (!fs.existsSync(bookingsFilePath)) {
      return [];
    }
    const fileContent = fs.readFileSync(bookingsFilePath, 'utf-8');
    const bookings = JSON.parse(fileContent);
    return bookings;
  } catch (error) {
    return [];
  }
}

// 18. save all bookings into bookings.json file
export function saveBookings(bookings) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const fileContent = JSON.stringify(bookings, null, 2);
  fs.writeFileSync(bookingsFilePath, fileContent, 'utf-8');
}

// Module 5 Bookmarks
const bookmarksFilePath = path.join(process.cwd(), 'data', 'bookmarks.json');
export function readBookmarks() {
  try {
    if (!fs.existsSync(bookmarksFilePath)) return [];
    return JSON.parse(fs.readFileSync(bookmarksFilePath, 'utf-8'));
  } catch (e) { return []; }
}
export function saveBookmarks(bookmarks) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(bookmarksFilePath, JSON.stringify(bookmarks, null, 2), 'utf-8');
}

// ============================================================
// Module 6: Registration & Attendance - Data Access Functions
// ============================================================

// 19. define paths for Module 6 JSON files
const registrationsFilePath = path.join(process.cwd(), 'data', 'registrations.json');
const waitlistFilePath = path.join(process.cwd(), 'data', 'waitlist.json');
const ticketsFilePath = path.join(process.cwd(), 'data', 'tickets.json');
const attendanceFilePath = path.join(process.cwd(), 'data', 'attendance.json');

// 20. read and save registrations
export function readRegistrations() {
  try {
    if (!fs.existsSync(registrationsFilePath)) return [];
    return JSON.parse(fs.readFileSync(registrationsFilePath, 'utf-8'));
  } catch (e) { return []; }
}
export function saveRegistrations(registrations) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(registrationsFilePath, JSON.stringify(registrations, null, 2), 'utf-8');
}

// 21. read and save waitlist
export function readWaitlist() {
  try {
    if (!fs.existsSync(waitlistFilePath)) return [];
    return JSON.parse(fs.readFileSync(waitlistFilePath, 'utf-8'));
  } catch (e) { return []; }
}
export function saveWaitlist(waitlist) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(waitlistFilePath, JSON.stringify(waitlist, null, 2), 'utf-8');
}

// 22. read and save tickets
export function readTickets() {
  try {
    if (!fs.existsSync(ticketsFilePath)) return [];
    return JSON.parse(fs.readFileSync(ticketsFilePath, 'utf-8'));
  } catch (e) { return []; }
}
export function saveTickets(tickets) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(ticketsFilePath, JSON.stringify(tickets, null, 2), 'utf-8');
}

// 23. read and save attendance records
export function readAttendance() {
  try {
    if (!fs.existsSync(attendanceFilePath)) return [];
    return JSON.parse(fs.readFileSync(attendanceFilePath, 'utf-8'));
  } catch (e) { return []; }
}
export function saveAttendance(attendance) {
  const folderPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(attendanceFilePath, JSON.stringify(attendance, null, 2), 'utf-8');
}

