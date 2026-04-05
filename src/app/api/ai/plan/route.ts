import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topics, availableTime } = await req.json();

    // Mock AI Response simulating an intelligent planner using user input
    const generatedPlan = {
      message: "Digital Twin successfully updated to reflect new learning materials.",
      confidence: 0.92,
      plan: [
        {
          time: "10:00 AM",
          title: `Focus Session: ${topics[0] || 'Core Concepts'}`,
          duration: Math.floor(availableTime * 0.4) + " hours",
          priority: "High",
          reason: "Identified as a weak point in the last assessment."
        },
        {
          time: "02:00 PM",
          title: "Practice Exercises",
          duration: Math.floor(availableTime * 0.3) + " hours",
          priority: "Medium",
          reason: "Application of theory is necessary for retention."
        },
        {
          time: "05:00 PM",
          title: "Review & Quiz",
          duration: Math.floor(availableTime * 0.3) + " hours",
          priority: "Low",
          reason: "Spaced repetition to lock in knowledge."
        }
      ]
    };

    return NextResponse.json(generatedPlan);
  } catch {
    return NextResponse.json({ error: "Failed to generate study plan." }, { status: 500 });
  }
}
