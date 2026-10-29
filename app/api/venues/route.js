import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth';
import { readVenues, saveVenues } from '@/lib/db';

// ==================== GET /api/venues ====================
// Returns all venues. Public access (no auth needed).
export async function GET(request) {
  try {
    // 1. Read all venues from the database
    const venues = readVenues();

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    // 3. Filter active venues unless ?all=true is explicitly requested
    const filteredVenues = showAll ? venues : venues.filter(v => v.isActive !== false);

    // 4. Return the list of venues
    return NextResponse.json({
      message: 'Venues retrieved successfully',
      venues: filteredVenues,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { message: 'Internal server error while fetching venues' },
      { status: 500 }
    );
  }
}

// ==================== POST /api/venues ====================
// Creates a new venue. Admin only.
export async function POST(request) {
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
        { message: 'Forbidden. Admin access required to add venues.' },
        { status: 403 }
      );
    }

    // 2. Parse the request body
    const body = await request.json();
    const {
      name,
      type,
      capacity,
      location,
      facilities,
      availableDays,
      availableFrom,
      availableTo,
      requiresApproval
    } = body;

    // 3. Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: 'Venue name is required.' },
        { status: 400 }
      );
    }
    if (!type || !type.trim()) {
      return NextResponse.json(
        { message: 'Venue type is required (e.g. Auditorium, Seminar Hall, Lab, Playground).' },
        { status: 400 }
      );
    }
    if (!capacity || Number(capacity) <= 0) {
      return NextResponse.json(
        { message: 'Capacity must be a positive number.' },
        { status: 400 }
      );
    }
    if (!location || !location.trim()) {
      return NextResponse.json(
        { message: 'Venue location is required.' },
        { status: 400 }
      );
    }

    // 4. Check for duplicate venue name (case-insensitive)
    const venues = readVenues();
    const isDuplicate = venues.some(
      (v) => v.name.trim().toLowerCase() === name.trim().toLowerCase() && v.isActive !== false
    );
    if (isDuplicate) {
      return NextResponse.json(
        { message: `A venue with the name "${name.trim()}" already exists.` },
        { status: 409 }
      );
    }

    // 5. Parse facilities (accepts array or comma-separated string)
    let parsedFacilities = [];
    if (Array.isArray(facilities)) {
      parsedFacilities = facilities.map(f => String(f).trim()).filter(Boolean);
    } else if (typeof facilities === 'string' && facilities.trim()) {
      parsedFacilities = facilities.split(',').map(f => f.trim()).filter(Boolean);
    }

    // 6. Parse available days
    const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let parsedDays = defaultDays;
    if (Array.isArray(availableDays) && availableDays.length > 0) {
      parsedDays = availableDays;
    } else if (typeof availableDays === 'string' && availableDays.trim()) {
      parsedDays = availableDays.split(',').map(d => d.trim()).filter(Boolean);
    }

    // 7. Validate timings
    const parsedFrom = availableFrom && availableFrom.trim() ? availableFrom.trim() : '08:00';
    const parsedTo = availableTo && availableTo.trim() ? availableTo.trim() : '20:00';
    if (parsedFrom >= parsedTo) {
      return NextResponse.json(
        { message: 'Opening time (availableFrom) must be earlier than closing time (availableTo).' },
        { status: 400 }
      );
    }

    // 8. Create the new venue object
    const newVenue = {
      id: Date.now().toString(),
      name: name.trim(),
      type: type.trim(),
      capacity: Number(capacity),
      location: location.trim(),
      facilities: parsedFacilities,
      availableDays: parsedDays,
      availableFrom: parsedFrom,
      availableTo: parsedTo,
      requiresApproval: requiresApproval !== undefined ? Boolean(requiresApproval) : true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 9. Save to database
    venues.push(newVenue);
    saveVenues(venues);

    // 10. Return the created venue
    return NextResponse.json(
      {
        message: 'Venue created successfully',
        venue: newVenue,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json(
      { message: 'Internal server error while creating venue' },
      { status: 500 }
    );
  }
}
