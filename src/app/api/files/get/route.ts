import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: files, error } = await supabase
      .from('files')
      .select('id, name, type, size, category, status, progress, url, analysis_json, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedFiles = (files || []).map((f: any) => ({
      ...f,
      analysis: f.analysis_json ?? null,
      date: f.created_at ? new Date(f.created_at).toLocaleString() : 'N/A',
    }));

    return NextResponse.json({ success: true, files: formattedFiles });
  } catch (error: any) {
    console.error('Files GET Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch files', details: error.message }, { status: 500 });
  }
}
