import { NextResponse } from 'next/server';
import { readCategories, saveCategories } from '@/lib/db';

// GET /api/categories - get all categories
export async function GET() {
  try {
    const categories = readCategories();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - add a new category
export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json(
        { message: 'Category name is required' },
        { status: 400 }
      );
    }

    const categories = readCategories();
    if (!categories.includes(name)) {
      categories.push(name);
      saveCategories(categories);
    }

    return NextResponse.json(
      { message: 'Category added successfully', categories },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to add category' },
      { status: 500 }
    );
  }
}
