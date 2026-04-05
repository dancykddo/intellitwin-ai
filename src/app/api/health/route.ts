import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import admin from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: { database: 'unknown', storage: 'unknown', ai: 'unknown' },
  };

  // 1. Check Supabase database
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    if (error) throw error;
    health.services.database = 'connected';
  } catch (e: any) {
    health.status = 'unhealthy';
    health.services.database = `error: ${e.message}`;
  }

  // 2. Check Firebase storage
  try {
    if (admin.apps.length) {
      const bucket = admin.storage().bucket();
      const [exists] = await bucket.exists();
      health.services.storage = exists ? 'connected' : 'bucket not found';
    } else {
      health.services.storage = 'not configured';
    }
  } catch (e: any) {
    health.status = 'unhealthy';
    health.services.storage = `error: ${e.message}`;
  }

  // 3. Check Gemini AI
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('ping');
    health.services.ai = 'connected';
  } catch (e: any) {
    health.status = 'unhealthy';
    health.services.ai = `error: ${e.message}`;
  }

  return NextResponse.json(health, { status: health.status === 'healthy' ? 200 : 503 });
}
