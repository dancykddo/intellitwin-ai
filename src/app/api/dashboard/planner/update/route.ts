import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { id, completed } = await request.json();

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: Boolean(completed),
        category: completed ? 'Completed' : 'Today',
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Planner Update Error:', error.message);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
