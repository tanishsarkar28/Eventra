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
