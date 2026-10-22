import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readUsers } from './db.js';

// secret key used to sign and verify jwt tokens
const JWT_SECRET = process.env.JWT_SECRET || 'eventra_simple_secret_key_123';

// 1. turn a plain password into a secure hashed password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

// 2. check if the typed password matches the saved hashed password
export async function checkPassword(password, hashedPassword) {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
}

// 3. create a login token that stores user id, email, and role
export function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // create token valid for 7 days
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return token;
}

// 4. read the token from request cookies and find the logged-in user
export async function getLoggedInUser(request) {
  try {
    let token = null;

    // read token using Next.js request.cookies if available
    if (request && request.cookies && typeof request.cookies.get === 'function') {
      const cookieObject = request.cookies.get('token');
      if (cookieObject) {
        token = cookieObject.value;
      }
    }

    // fallback: read token from cookie header
    if (!token && request && request.headers) {
      const cookieHeader = request.headers.get('cookie') || '';
      const cookieParts = cookieHeader.split(';');
      for (let part of cookieParts) {
        const [name, value] = part.trim().split('=');
        if (name === 'token') {
          token = value;
          break;
        }
      }
    }

    // if no token found, user is not logged in
    if (!token) {
      return null;
    }

    // verify the token using our secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return null;
    }

    // read users from file
    const users = readUsers();

    // find user with matching id
    const user = users.find((u) => u.id === decoded.id);
    if (!user) {
      return null;
    }

    // return the user without the password field
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  } catch (error) {
    // if token is invalid or expired, return null
    return null;
  }
}
