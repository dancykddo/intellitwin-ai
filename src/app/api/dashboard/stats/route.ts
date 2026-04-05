import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch data from DB
    const settings: any = await query('SELECT * FROM settings WHERE id = 1');
    const tasks: any = await query('SELECT * FROM tasks');
    const files: any = await query('SELECT * FROM files');

    const completedTasksCount = tasks.filter((t: any) => t.completed).length;
    
    // Simple mock for streak if not in settings, but we'll try to derive
    const streak = settings[0]?.daily_hours > 0 ? 14 : 0; 

    // Calculate hours from duration strings like "2 hours" or "1.5 hours"
    let totalHours = 0;
    tasks.forEach((t: any) => {
      if (t.completed && t.duration) {
        const hoursMatch = t.duration.match(/(\d+(\.\d+)?)/);
        if (hoursMatch) {
          totalHours += parseFloat(hoursMatch[0]);
        }
      }
    });

    // Mastery calculation
    const totalPossibleTasks = tasks.length || 1;
    const mastery = Math.round((completedTasksCount / totalPossibleTasks) * 100);

    return NextResponse.json({
      streak,
      completed: completedTasksCount,
      hours: totalHours.toFixed(1),
      mastery: Math.min(100, mastery + 50), // base mastery + completion
      uploadCount: files.length,
      lastActive: settings[0]?.last_active
    });
  } catch (error: any) {
    console.error("Database error in stats GET:", error.message || error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats", details: error.message }, { status: 500 });
  }
}
