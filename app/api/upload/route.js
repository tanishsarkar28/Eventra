import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLoggedInUser } from '@/lib/auth';

// POST /api/upload - upload an event poster image
export async function POST(request) {
  try {
    // 1. verify the user is logged in
    const user = await getLoggedInUser(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    // 2. parse form data
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('poster');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { message: 'Please select an image file to upload.' },
        { status: 400 }
      );
    }

    // 3. read bytes from the uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. ensure the public/uploads folder exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 5. sanitize filename and add timestamp
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${cleanFileName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // 6. save the file
    fs.writeFileSync(filePath, buffer);

    // 7. return the public url
    return NextResponse.json(
      {
        message: 'Poster uploaded successfully',
        url: `/uploads/${uniqueFileName}`,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to upload poster image' },
      { status: 500 }
    );
  }
}
