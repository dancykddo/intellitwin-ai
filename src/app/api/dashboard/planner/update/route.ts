import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id, completed } = await request.json();
    
    await query(
      'UPDATE tasks SET completed = ?, category = ? WHERE id = ?',
      [completed, completed ? 'Completed' : 'Today', id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error in planner update API:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
