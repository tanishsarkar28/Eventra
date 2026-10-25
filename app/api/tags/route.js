import { NextResponse } from 'next/server';
import { readTags, saveTags } from '@/lib/db';

// GET /api/tags - get all tags
export async function GET() {
  try {
    const tags = readTags();
    return NextResponse.json({ tags }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/tags - add a new tag
export async function POST(request) {
  try {
    const body = await request.json();
    const tag = body.tag ? body.tag.trim().toLowerCase() : '';

    if (!tag) {
      return NextResponse.json(
        { message: 'Tag name is required' },
        { status: 400 }
      );
    }

    const tags = readTags();
    if (!tags.includes(tag)) {
      tags.push(tag);
      saveTags(tags);
    }

    return NextResponse.json(
      { message: 'Tag added successfully', tags },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to add tag' },
      { status: 500 }
    );
  }
}
