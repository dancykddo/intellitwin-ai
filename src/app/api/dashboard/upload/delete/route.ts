import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'File ID is required' }, { status: 400 });

    const { error } = await supabase.from('files').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Upload Delete Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete file', details: error.message }, { status: 500 });
  }
}
