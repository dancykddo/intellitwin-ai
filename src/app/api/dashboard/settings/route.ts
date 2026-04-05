import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const results: any = await query('SELECT * FROM settings LIMIT 1');
    const settings = results[0] || {};
    
    const parseJSON = (val: any, fallback: any) => {
      if (!val) return fallback;
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch (e) {
        return fallback;
      }
    };

    return NextResponse.json({
      profile: {
        name: settings.name || 'Alex Student',
        email: settings.email || 'alex@intellitwin.ai',
        studyGoal: settings.study_goal || 'Master Computer Science fundamentals',
        dailyHours: settings.daily_hours || 4,
        learningPace: settings.learning_pace || 'Medium',
      },
      notifications: parseJSON(settings.notifications_json, {
        studyReminders: true, deadlineAlerts: true, aiSuggestions: true,
        progressReports: false, weeklyDigest: true,
      }),
      ai: {
        difficultyLevel: settings.difficulty_level || 'Intermediate',
        focusSubjects: parseJSON(settings.focus_subjects, ['Data Structures', 'Algorithms', 'OS']),
        ...parseJSON(settings.ai_json, {
          studyStyle: 'Mixed',
          enableAutoSchedule: true,
          enableAdaptiveLearning: true,
        })
      },
      appearance: {
        theme: settings.theme || 'dark',
        accentColor: settings.accent_color || '#00f2fe',
        ...parseJSON(settings.appearance_json, {
          fontSize: 'medium',
          compactMode: false,
        })
      },
      stats: {
        totalStudySessions: 147,
        knowledgeItems: 23,
        plannerTasks: 41,
        lastActive: settings.last_active || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Database error in settings GET:", error.message || error);
    return NextResponse.json({ error: "Failed to fetch settings", details: error.message }, { status: 500 });
  }
}

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
    console.error("Database error in settings POST:", error.message || error);
    return NextResponse.json({ error: "Failed to save settings", details: error.message }, { status: 500 });
  }
}
