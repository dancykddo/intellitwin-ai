import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { id, title, time, duration, priority, category } = await request.json();

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase.from('tasks').insert([{
      id, title, time, duration, priority, category, completed: false,
    }]);

    if (error) throw error;

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Planner Save POST Error:', error.message);
    return NextResponse.json({ error: 'Failed to create task', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Planner Save DELETE Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete task', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabase.from('tasks').update(updates).eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Planner Save PATCH Error:', error.message);
    return NextResponse.json({ error: 'Failed to update task', details: error.message }, { status: 500 });
  }
}
