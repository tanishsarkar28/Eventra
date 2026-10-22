import { NextResponse } from 'next/server';
import { readUsers, saveUsers } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

export async function POST(request) {
  try {
    // 1. check if user is logged in
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    // 2. check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // 3. get the organiser id from request body
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json(
        { message: 'Please provide an organiser id' },
        { status: 400 }
      );
    }

    // 4. read all users from users.json
    const users = readUsers();

    // 5. find the organiser with matching id
    const organiser = users.find((u) => u.id === id);
    if (!organiser) {
      return NextResponse.json(
        { message: 'Organiser not found' },
        { status: 404 }
      );
    }

    // 6. verify that this user is actually an organiser
    if (organiser.role !== 'organiser') {
      return NextResponse.json(
        { message: 'Target user is not an organiser' },
        { status: 400 }
      );
    }

    // 7. set isVerified to true
    organiser.isVerified = true;

    // 8. save updated users back to users.json
    saveUsers(users);

    // 9. return success message
    return NextResponse.json(
      { message: 'Organiser verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    // 10. handle server errors
    return NextResponse.json(
      { message: 'Failed to verify organiser' },
      { status: 500 }
    );
  }
}
