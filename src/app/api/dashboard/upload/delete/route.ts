import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "File ID is required" }, { status: 400 });

    await query('DELETE FROM files WHERE id = ?', [id]);

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Database error in upload delete API:", error.message || error);
    return NextResponse.json({ error: "Failed to delete file", details: error.message }, { status: 500 });
  }
}
