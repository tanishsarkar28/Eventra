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
