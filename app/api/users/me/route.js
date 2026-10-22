import { NextResponse } from 'next/server';
import { readUsers, saveUsers } from '@/lib/db';
import { getLoggedInUser } from '@/lib/auth';

// GET /api/users/me - return current logged-in user
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

    // 2. return the user object (password is never included)
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    // 3. handle server errors
    return NextResponse.json(
      { message: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me - update name, branch, year, interests
export async function PATCH(request) {
  try {
    // 1. check if user is logged in
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    // 2. get updated data from request body
    const body = await request.json();

    // 3. read all users from users.json
    const users = readUsers();

    // 4. find the index of the logged-in user
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex === -1) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // 5. update name if provided
    if (body.name !== undefined) {
      users[userIndex].name = body.name.trim();
    }

    // 6. update branch if provided
    if (body.branch !== undefined) {
      users[userIndex].branch = body.branch.trim();
    }

    // 7. update year if provided
    if (body.year !== undefined) {
      users[userIndex].year = body.year.toString().trim();
    }

    // 8. update interests array if provided
    if (body.interests !== undefined) {
      if (Array.isArray(body.interests)) {
        users[userIndex].interests = body.interests;
      } else if (typeof body.interests === 'string') {
        // split comma separated text like "coding, sports"
        users[userIndex].interests = body.interests
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    }

    // 9. save the updated users back to users.json
    saveUsers(users);

    // 10. make a safe copy without password
    const updatedUser = { ...users[userIndex] };
    delete updatedUser.password;

    // 11. return success response with updated user
    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    // 12. handle server errors
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
