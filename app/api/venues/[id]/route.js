import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { readVenues, saveVenues } from '@/lib/db';

// ==================== GET /api/venues/:id ====================
// Get a single venue by id. Public access.
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const venues = readVenues();
    const venue = venues.find(v => v.id === id);

    if (!venue) {
      return NextResponse.json(
        { message: 'Venue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ venue }, { status: 200 });
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json(
      { message: 'Internal server error while fetching venue' },
      { status: 500 }
    );
  }
}

// ==================== PUT /api/venues/:id ====================
// Update a venue. Admin only. Accepts partial updates.
export async function PUT(request, { params }) {
  try {
    // 1. Authenticate user and check admin role
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden. Admin access required to update venue.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const venues = readVenues();
    const venueIndex = venues.findIndex(v => v.id === id);

    if (venueIndex === -1) {
      return NextResponse.json(
        { message: 'Venue not found' },
        { status: 404 }
      );
    }

    const venue = venues[venueIndex];

    // 2. Validate capacity if provided
    if (body.capacity !== undefined) {
      if (Number(body.capacity) <= 0) {
        return NextResponse.json(
          { message: 'Capacity must be greater than 0.' },
          { status: 400 }
        );
      }
      venue.capacity = Number(body.capacity);
    }

    // 3. Update fields if provided
    if (body.name !== undefined && body.name.trim()) venue.name = body.name.trim();
    if (body.type !== undefined && body.type.trim()) venue.type = body.type.trim();
    if (body.location !== undefined && body.location.trim()) venue.location = body.location.trim();

    if (body.facilities !== undefined) {
      if (Array.isArray(body.facilities)) {
        venue.facilities = body.facilities.map(f => String(f).trim()).filter(Boolean);
      } else if (typeof body.facilities === 'string') {
        venue.facilities = body.facilities.split(',').map(f => f.trim()).filter(Boolean);
      }
    }

    if (body.availableDays !== undefined) {
      if (Array.isArray(body.availableDays)) {
        venue.availableDays = body.availableDays;
      } else if (typeof body.availableDays === 'string') {
        venue.availableDays = body.availableDays.split(',').map(d => d.trim()).filter(Boolean);
      }
    }

    if (body.availableFrom !== undefined) venue.availableFrom = body.availableFrom.trim();
    if (body.availableTo !== undefined) venue.availableTo = body.availableTo.trim();

    if (venue.availableFrom && venue.availableTo && venue.availableFrom >= venue.availableTo) {
      return NextResponse.json(
        { message: 'Opening time must be earlier than closing time.' },
        { status: 400 }
      );
    }

    if (body.requiresApproval !== undefined) {
      venue.requiresApproval = Boolean(body.requiresApproval);
    }

    if (body.isActive !== undefined) {
      venue.isActive = Boolean(body.isActive);
    } else if (body.status !== undefined) {
      venue.isActive = body.status === 'Active' || body.status === true;
    }

    venue.updatedAt = new Date().toISOString();
    venues[venueIndex] = venue;
    saveVenues(venues);

    return NextResponse.json({
      message: 'Venue updated successfully',
      venue,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating venue:', error);
    return NextResponse.json(
      { message: 'Internal server error while updating venue' },
      { status: 500 }
    );
  }
}

// ==================== DELETE /api/venues/:id ====================
// Soft delete a venue (sets isActive=false). Admin only.
export async function DELETE(request, { params }) {
  try {
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden. Admin access required to delete venue.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const venues = readVenues();
    const venueIndex = venues.findIndex(v => v.id === id);

    if (venueIndex === -1) {
      return NextResponse.json(
        { message: 'Venue not found' },
        { status: 404 }
      );
    }

    venues[venueIndex].isActive = false;
    venues[venueIndex].updatedAt = new Date().toISOString();
    saveVenues(venues);

    return NextResponse.json({
      message: 'Venue deactivated successfully',
      venue: venues[venueIndex],
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting venue:', error);
    return NextResponse.json(
      { message: 'Internal server error while deleting venue' },
      { status: 500 }
    );
  }
}
