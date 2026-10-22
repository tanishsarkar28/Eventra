import { NextResponse } from 'next/server';
import { readUsers } from '@/lib/db';
import { checkPassword, createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    // 1. get the email and password from the request body
    const body = await request.json();
    const email = body.email ? body.email.trim().toLowerCase() : '';
    const password = body.password ? body.password.trim() : '';

    // 2. check if email and password are provided
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 3. read all users from users.json
    const users = readUsers();

    // 4. find the user by email
    const user = users.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 5. check if the password is correct
    const isPasswordCorrect = await checkPassword(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 6. create a login token for this user
    const token = createToken(user);

    // 7. create the success response
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // 8. save the login token in a cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    // 9. return response with the cookie
    return response;
  } catch (error) {
    // 10. handle server errors
    return NextResponse.json(
      { message: 'Login failed due to a server error' },
      { status: 500 }
    );
  }
}
