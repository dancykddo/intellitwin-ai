import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const tasks: any = await query("SELECT * FROM tasks WHERE category = 'Today' ORDER BY created_at DESC");
    
    // UI expects specific color classes, let's map them if missing
    const tasksWithBg = tasks.map((t: any) => ({
      ...t,
      bg: t.priority === 'High' ? 'bg-[#00f2fe]/10' : t.priority === 'Medium' ? 'bg-orange-500/10' : 'bg-emerald-500/10'
    }));

    return NextResponse.json(tasksWithBg);
  } catch (error: any) {
    console.error("Database error in tasks GET:", error.message || error);
    return NextResponse.json({ error: "Failed to fetch tasks", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, completed } = await request.json();
    if (!id) return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    await query("UPDATE tasks SET completed = ? WHERE id = ?", [completed ? 1 : 0, id]);

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Database error in tasks POST:", error.message || error);
    return NextResponse.json({ error: "Failed to update task", details: error.message }, { status: 500 });
  }
}
