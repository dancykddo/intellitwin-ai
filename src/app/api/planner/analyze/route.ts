import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { fileUrl, id } = await req.json();

    if (!fileUrl || !id) {
       return NextResponse.json({ error: "Missing fileUrl or id" }, { status: 400 });
    }

    // 1. Fetch file content
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract text from PDF
    let rawText = '';
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      rawText = data.text;
    } catch (parseError: any) {
      console.error("PDF Parse Error:", parseError);
      return NextResponse.json({ error: "Failed to parse PDF content", details: parseError.message }, { status: 500 });
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({ error: "Insufficient text extracted from PDF" }, { status: 400 });
    }

    // 3. AI Analysis via Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Analyze the following educational content and provide a structured JSON response.
      The content is: "${rawText.slice(0, 15000)}" // Limit text to avoid prompt limits
      
      Return ONLY a JSON object with this exact structure:
      {
        "summary": "Short 2-3 sentence overview of the content",
        "topics": ["Topic 1", "Topic 2", "Topic 3"],
        "difficulty": "Beginner/Intermediate/Advanced",
        "estimatedTime": "X Hours",
        "modules": [
          { "title": "Module Title", "description": "Quick desc" }
        ],
        "qa": [
          { "question": "Question text", "answer": "Answer text" }
        ],
        "studyPlan": [
           { "day": "Day 1", "activity": "Activity description" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();
    
    // Clean JSON response (sometimes Gemini adds ```json ... ```)
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find JSON in AI response");
    
    const analysisData = JSON.parse(jsonMatch[0]);

    // 4. Save to Database
    await query(
      `UPDATE files SET analysis_json = ?, status = 'Completed', progress = 100 WHERE id = ?`,
      [JSON.stringify(analysisData), id]
    );

    return NextResponse.json({ success: true, analysis: analysisData });
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: "Analysis failed", details: error.message }, { status: 500 });
  }
}
