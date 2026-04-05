import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { userId, topics, availableHours } = await req.json();

    // 1. Fetch user's knowledge base if topics are not provided
    let context = "";
    if (!topics || topics.length === 0) {
      const files: any = await query(
        "SELECT analysis_json FROM files WHERE analysis_json IS NOT NULL LIMIT 5"
      );
      context = files.map((f: any) => JSON.parse(f.analysis_json).summary).join("\n");
    } else {
      context = `User wants to focus on: ${topics.join(", ")}`;
    }

    // 2. AI Study Plan Generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Based on the following knowledge summary, generate a detailed study plan for ${availableHours || 4} hours.
      Knowledge context: "${context}"
      
      Return a JSON array of slots:
      {
        "plan": [
          { "time": "10:00 AM", "activity": "...", "duration": "1 hour", "priority": "High" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find JSON in AI response");
    
    const generatedPlan = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, ...generatedPlan });
  } catch (error: any) {
    console.error("Generate API Error:", error);
    return NextResponse.json({ error: "Generation failed", details: error.message }, { status: 500 });
  }
}
