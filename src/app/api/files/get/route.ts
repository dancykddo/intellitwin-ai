import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const files: any = await query(
      "SELECT id, name, type, size, category, status, progress, url, analysis_json, created_at FROM files ORDER BY created_at DESC"
    );

    const formattedFiles = files.map((f: any) => ({
      ...f,
      analysis: f.analysis_json ? JSON.parse(f.analysis_json) : null,
      date: f.created_at ? new Date(f.created_at).toLocaleString() : 'N/A'
    }));

    return NextResponse.json({ success: true, files: formattedFiles });
  } catch (error: any) {
    console.error("Files GET API Error:", error);
    return NextResponse.json({ error: "Failed to fetch files", details: error.message }, { status: 500 });
  }
}
