import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id, name, type, size, date, category, status, progress, analysis, url, userId } = await request.json();
    
    if (!id || !name) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const analysisJsonString = analysis ? (typeof analysis === 'string' ? analysis : JSON.stringify(analysis)) : null;

    // Upsert logic
    await query(
      `INSERT INTO files (id, name, type, size, date, category, status, progress, url, analysis_json, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       status = VALUES(status), 
       progress = VALUES(progress),
       analysis_json = VALUES(analysis_json),
       url = VALUES(url)`,
      [id, name, type, size, date, category, status, progress, url, analysisJsonString, userId || null]
    );

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error("Database error in upload save API:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to save file metadata", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
