import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id, title, time, duration, priority, category } = await request.json();
    
    if (!id || !title) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await query(
      `INSERT INTO tasks (id, title, time, duration, priority, category, completed) 
       VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
      [id, title, time, duration, priority, category]
    );

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error("Database error in planner tasks POST:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to create task", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    await query('DELETE FROM tasks WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Database error in planner tasks DELETE:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to delete task", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    // Build dynamic update query
    const keys = Object.keys(updates);
    if (keys.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    await query(`UPDATE tasks SET ${setClause} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Database error in planner tasks PATCH:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to update task", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
