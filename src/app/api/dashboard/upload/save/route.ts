import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { id, name, type, size, date, category, status, progress, analysis, url, userId } =
      await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase.from('files').upsert([{
      id, name, type, size, date, category, status, progress,
      url: url || null,
      analysis_json: analysis || null,
      user_id: userId || null,
    }]);

    if (error) throw error;

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Upload Save Error:', error.message);
    return NextResponse.json({ error: 'Failed to save file metadata', details: error.message }, { status: 500 });
  }
}
