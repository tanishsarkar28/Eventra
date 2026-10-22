import { NextResponse } from 'next/server';
import { readUsers } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

export async function GET(request) {
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

    // 3. read all users from users.json
    const users = readUsers();

    // 4. filter organisers that are not verified yet
    const pendingOrganisers = users.filter((u) => {
      return u.role === 'organiser' && u.isVerified === false;
    });

    // 5. remove passwords before returning the list
    const safeOrganisers = pendingOrganisers.map((org) => {
      const copy = { ...org };
      delete copy.password;
      return copy;
    });

    // 6. return the list of pending organisers
    return NextResponse.json(
      { organisers: safeOrganisers },
      { status: 200 }
    );
  } catch (error) {
    // 7. handle server errors
    return NextResponse.json(
      { message: 'Failed to fetch pending organisers' },
      { status: 500 }
    );
  }
}
