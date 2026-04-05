import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// This is an alias endpoint that forwards to the main settings POST
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, notifications, ai, appearance } = body;

    const { difficultyLevel, focusSubjects, ...aiRest } = ai || {};
    const { theme, accentColor, ...appearanceRest } = appearance || {};

    await query(
      `UPDATE settings SET 
        name = ?, email = ?, study_goal = ?, daily_hours = ?, learning_pace = ?, 
        difficulty_level = ?, focus_subjects = ?, 
        theme = ?, accent_color = ?,
        notifications_json = ?, ai_json = ?, appearance_json = ?
      WHERE id = 1`,
      [
        profile?.name, profile?.email, profile?.studyGoal, profile?.dailyHours, profile?.learningPace,
        difficultyLevel, JSON.stringify(focusSubjects || []), 
        theme, accentColor,
        JSON.stringify(notifications || {}), JSON.stringify(aiRest || {}), JSON.stringify(appearanceRest || {})
      ]
    );

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Database error in settings update:", error.message || error);
    return NextResponse.json({ error: "Failed to save settings", details: error.message }, { status: 500 });
  }
}
