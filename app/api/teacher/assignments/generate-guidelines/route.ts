import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { summarizeTeacherInstructions } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/**
 * AI Student Guideline Generation Engine
 * Summarizes teacher notes, voice transcriptions, or syllabus text into
 * concise, student-friendly guidelines using Google Gemini API
 * with safe institutional heuristic fallback.
 * 
 * PRIVACY GUARANTEE:
 * Only minimal pedagogical text (raw instructions, optional subject title, and deadline)
 * is sent to Gemini. Teacher credentials, student data, and internal IDs are NEVER sent.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized access to faculty tools." },
        { status: 403 }
      );
    }

    const { rawInput, inputMode, deadline, subjectTitle } = await req.json();

    if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
      return NextResponse.json(
        { error: "Please provide instruction notes, reference text, or voice transcription." },
        { status: 400 }
      );
    }

    // Call Gemini summarization (with automatic safe fallback)
    const { guidelines, source } = await summarizeTeacherInstructions(
      rawInput,
      subjectTitle,
      deadline
    );

    return NextResponse.json({
      success: true,
      guidelines,
      sourceMode: inputMode || "MANUAL_NOTES",
      engine: source === "GEMINI" ? "Google Gemini 1.5 Flash" : "Institutional Synthesizer",
    });
  } catch (error: any) {
    console.error("AI guideline generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate guidelines." },
      { status: 500 }
    );
  }
}
