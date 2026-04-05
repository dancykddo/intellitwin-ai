import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import admin from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const healthResults: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      storage: 'unknown',
      ai: 'unknown',
    },
  };

  try {
    // 1. Check Database
    await query('SELECT 1');
    healthResults.services.database = 'connected';
  } catch (dbError: any) {
    healthResults.status = 'unhealthy';
    healthResults.services.database = `error: ${dbError.message}`;
  }

  try {
    // 2. Check Storage (Firebase Admin)
    const bucket = admin.storage().bucket();
    const [exists] = await bucket.exists();
    healthResults.services.storage = exists ? 'connected' : 'bucket not found';
  } catch (storageError: any) {
    healthResults.status = 'unhealthy';
    healthResults.services.storage = `error: ${storageError.message}`;
  }

  try {
    // 3. Check AI (Gemini)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // Simple prompt to test connectivity (don't over-bill)
    await model.generateContent("ping");
    healthResults.services.ai = 'connected';
  } catch (aiError: any) {
    healthResults.status = 'unhealthy';
    healthResults.services.ai = `error: ${aiError.message}`;
  }

  const statusCode = healthResults.status === 'healthy' ? 200 : 503;
  return NextResponse.json(healthResults, { status: statusCode });
}
