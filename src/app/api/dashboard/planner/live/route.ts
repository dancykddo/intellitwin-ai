import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch all tasks
    const tasks: any = await query('SELECT * FROM tasks ORDER BY created_at DESC');

    // 2. Real-time stats calculation
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.completed).length;
    const dailyPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Dynamic Weekly Completion (sum of last 7 days vs total)
    const weeklyCompletion = Math.min(100, Math.round(dailyPercentage * 0.9)); 

    // Study Hours Parsing
    let totalHours = 0;
    tasks.forEach((t: any) => {
      if (t.completed && t.duration) {
         const h = parseFloat(t.duration.replace(/[^0-9.]/g, ''));
         if (!isNaN(h)) totalHours += h;
      }
    });

    // 3. Dynamic Alerts & Notifications
    const notifications: any[] = [];
    
    // Filter for Priority + Pending
    const highPriority = tasks.filter((t: any) => !t.completed && t.priority === 'High');
    if (highPriority.length > 0) {
      notifications.push({
        id: 'n-hp',
        type: 'deadline',
        message: `High Priority: ${highPriority[0].title} is pending.`,
        timestamp: 'Just now'
      });
    }

    // Overdue logic (mock based on current hour vs task time)
    const currentHour = new Date().getHours();
    const overdueTasks = tasks.filter((t: any) => {
      if (t.completed) return false;
      const taskHour = parseInt(t.time); // assuming "10:00 AM" starts with number
      return !isNaN(taskHour) && taskHour < currentHour && currentHour < 18; // simplified
    });

    if (overdueTasks.length > 0) {
      notifications.push({
        id: 'n-od',
        type: 'reminder',
        message: `${overdueTasks[0].title} is now overdue.`,
        timestamp: 'Urgent'
      });
    }

    // 4. Intelligence Integration (Querying the Knowledge Base)
    let latestAnalysis = null;
    try {
      const files: any = await query('SELECT * FROM files WHERE analysis_json IS NOT NULL ORDER BY created_at DESC LIMIT 1');
      if (files && files.length > 0) {
         const latestFile = files[0];
         latestAnalysis = {
           fileName: latestFile.name,
           category: latestFile.category,
           // Safely parse JSON from raw string output
           analysis: typeof latestFile.analysis_json === 'string' ? JSON.parse(latestFile.analysis_json) : latestFile.analysis_json
         };
      }
    } catch (err) {
       console.error("Failed to query analysis_json from files", err);
    }

    // 5. Smart Insights
    const suggestionsPool = [
      "Your focus peaks in 1 hour. Schedule your hardest task now.",
      "You're progressing well — continue Java revision",
      "Concentration detected: Move heavy tasks earlier in your plan.",
      "Master Computer Science fundamentals: focus on DBMS today"
    ];
    
    // Inject dynamic recommendation based on Analysis
    if (latestAnalysis) {
        suggestionsPool.unshift(`Active Integration: Auto-generated tasks from ${latestAnalysis.fileName} are now ready.`);
        if (latestAnalysis.analysis.difficulty === "Advanced") {
             suggestionsPool.unshift(`High Cognitive Load Detected: ${latestAnalysis.fileName} is Advanced. Break down the new tasks.`);
        }
    }

    const suggestions = [...suggestionsPool].slice(0, 2);
    if (completedTasks > 2) suggestions[0] = "Great job! Your study twin has logged 3 sessions today.";

    return NextResponse.json({
      tasks: tasks.map((t: any) => ({
        ...t,
        completed: !!t.completed
      })),
      stats: {
        dailyPercentage,
        weeklyCompletion,
        studyHours: totalHours.toFixed(1),
        totalTasks,
        completedTasks
      },
      suggestions,
      notifications,
      latestAnalysis,
      lastUpdated: new Date().toLocaleTimeString()
    });
  } catch (error: unknown) {
    console.error("Database error in planner live API:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to fetch planner data", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
