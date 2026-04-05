import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const suggestionsPool = [
  "You struggled with Binary Trees yesterday. I've re-added a small review session for tomorrow.",
  "Great job on SQL queries! You finished 20% faster than average.",
  "Your focus has been dropping after 4PM. Consider moving heavy tasks earlier.",
  "Based on recent test scores, we should allocate more time to Operating Systems.",
  "You've maintained a solid study streak! Take a 15-min break.",
  "New practice problems for DBMS Normalization have been generated."
];

export async function GET() {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)); // slight artificially delay for AI 'feel'

    // 1. Fetch upcoming tasks for deadlines (Priority: High)
    const deadlines: any = await query(`
      SELECT id, title, time, priority 
      FROM tasks 
      WHERE priority IN ('High', 'Medium') AND completed = 0 
      ORDER BY created_at ASC 
      LIMIT 3
    `);

    // Map priority colors
    const deadlinesWithColors = deadlines.map((d: any) => ({
      ...d,
      color: d.priority === 'High' ? 'red' : d.priority === 'Medium' ? 'yellow' : 'emerald'
    }));

    // 2. Fetch some activity stats for AI suggestions
    const fileCount: any = await query('SELECT COUNT(*) as count FROM files');
    
    const shuffledSugs = [...suggestionsPool].sort(() => 0.5 - Math.random()).slice(0, 2);
    
    // Add a dynamic suggestion based on file count
    if (fileCount[0]?.count > 0) {
      shuffledSugs[0] = `I've analyzed your ${fileCount[0].count} uploaded documents. Let's start with a review.`;
    }

    // 3. Dynamic AI task generation (30% chance)
    const dynamicTask = Math.random() > 0.7 ? {
      id: "ai-task-" + Date.now(),
      time: "08:00 PM",
      title: "AI Extra Review: " + ["Graphs", "Recursion", "Dynamic Prog.", "Heaps", "Sorting"][Math.floor(Math.random()*5)],
      duration: "30 mins",
      bg: "bg-purple-500/10",
      completed: false
    } : null;

    return NextResponse.json({
      suggestions: shuffledSugs,
      deadlines: deadlinesWithColors,
      newTask: dynamicTask
    });
  } catch (error: any) {
    console.error("Database error in live GET:", error.message || error);
    return NextResponse.json({ error: "Failed to fetch AI updates", details: error.message }, { status: 500 });
  }
}
