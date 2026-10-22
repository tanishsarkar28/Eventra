import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. create the response object
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // 2. clear the token cookie by setting its maxAge to 0
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    // 3. return response
    return response;
  } catch (error) {
    // 4. handle server errors
    return NextResponse.json(
      { message: 'Failed to log out' },
      { status: 500 }
    );
  }
}
