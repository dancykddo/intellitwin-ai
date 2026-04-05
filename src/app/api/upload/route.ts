import { NextResponse } from 'next/server';
import { bucket } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const formData = await req.json(); // If sending base64 or similar
    // Actually, normally files are sent as multipart/form-data
    // but in serverless, sometimes we get them differently.
    // Let's assume standard multipart/form-data for browser compatibility.
    
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${uuidv4()}-${file.name}`;
    const fileRef = bucket.file(`uploads/${fileName}`);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file publicly accessible or get a signed URL
    // For simplicity in this demo, we'll use a public-style URL if the bucket allows
    // Or better, a signed URL that lasts long.
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far in the future
    });

    return NextResponse.json({ 
      success: true, 
      url, 
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}
