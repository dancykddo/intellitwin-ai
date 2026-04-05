import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const results: any = await query('SELECT theme, accent_color, notifications_json, ai_json FROM settings WHERE id = 1 LIMIT 1');
    const settings = results[0] || {};
    
    return NextResponse.json({
      theme: settings.theme || 'dark',
      accentColor: settings.accent_color || '#00f2fe',
      notifications: typeof settings.notifications_json === 'string' ? JSON.parse(settings.notifications_json) : settings.notifications_json,
      ai: typeof settings.ai_json === 'string' ? JSON.parse(settings.ai_json) : settings.ai_json,
      lastUpdated: new Date().toLocaleTimeString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch live settings" }, { status: 500 });
  }
}
