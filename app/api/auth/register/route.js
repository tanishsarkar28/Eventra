import { NextResponse } from 'next/server';
import { readUsers, saveUsers } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    // 1. get the data from the request body
    const body = await request.json();
    const name = body.name ? body.name.trim() : '';
    const email = body.email ? body.email.trim().toLowerCase() : '';
    const password = body.password ? body.password.trim() : '';
    const role = body.role ? body.role.trim() : 'student';
    const clubName = body.clubName ? body.clubName.trim() : '';

    // 2. check required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // 3. allow only student or organiser role during registration
    if (role !== 'student' && role !== 'organiser') {
      return NextResponse.json(
        { message: 'Role must be student or organiser' },
        { status: 400 }
      );
    }

    // 4. if role is organiser, make sure clubName is provided
    if (role === 'organiser' && !clubName) {
      return NextResponse.json(
        { message: 'Club name is required for organisers' },
        { status: 400 }
      );
    }

    // 5. read all existing users
    const users = readUsers();

    // 6. check if this email is already registered
    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // 7. hash the password for security
    const hashedPassword = await hashPassword(password);

    // 8. organisers start as unverified (false), students start as verified (true)
    let isVerified = true;
    if (role === 'organiser') {
      isVerified = false;
    }

    // 9. create the new user object
    const newUser = {
      id: Date.now().toString(),
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
      branch: '',
      year: '',
      interests: [],
      clubName: role === 'organiser' ? clubName : '',
      isVerified: isVerified,
    };

    // 10. add new user to list and save to data/users.json
    users.push(newUser);
    saveUsers(users);

    // 11. return success response
    return NextResponse.json(
      { message: 'Registration successful', userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    // 12. handle any server errors
    return NextResponse.json(
      { message: 'Failed to register user' },
      { status: 500 }
    );
  }
}
