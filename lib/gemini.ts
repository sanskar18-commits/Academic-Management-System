/**
 * Institutional Gemini AI Integration Service
 * 
 * SECURITY & PRIVACY POLICY:
 * 1. The GEMINI_API_KEY is accessible exclusively by server-side processes.
 *    It is never exposed to the client-side bundle or browser window.
 * 2. Only minimum required text (query title, query description, or teacher instruction notes)
 *    is transmitted. Student credentials, passwords, database primary keys,
 *    and unrelated personal information are NEVER sent.
 * 3. Gemini is utilized solely for urgency classification ("HIGH" | "MEDIUM" | "LOW")
 *    and guideline synthesis. Gemini DOES NOT determine queue ordering.
 *    Queue ordering is strictly executed by our custom in-memory DSA PriorityQueue (Min-Heap).
 * 4. Resilient fault-tolerance: If Gemini fails, times out, or returns invalid data,
 *    the system gracefully stores the query in SQL and assigns a safe fallback
 *    priority of "MEDIUM" without crashing or losing data.
 */

export type UrgencyPriority = "HIGH" | "MEDIUM" | "LOW";

export interface QueryClassificationResult {
  priority: UrgencyPriority;
  reason: string;
  source: "GEMINI" | "FALLBACK";
}

const VALID_PRIORITIES: UrgencyPriority[] = ["HIGH", "MEDIUM", "LOW"];

/**
 * Validates and normalizes priority string strictly against allowed values.
 */
function isValidPriority(val: any): val is UrgencyPriority {
  return typeof val === "string" && VALID_PRIORITIES.includes(val.toUpperCase() as UrgencyPriority);
}

/**
 * Classifies the urgency of a student query using the Gemini API.
 * Returns strictly HIGH, MEDIUM, or LOW with a short reason.
 * 
 * Safe Fallback Guarantee:
 * Never throws. If GEMINI_API_KEY is missing, call times out, or invalid JSON is returned,
 * safe fallback priority "MEDIUM" is assigned and returned.
 */
export async function classifyStudentQuery(
  title: string,
  description: string
): Promise<QueryClassificationResult> {
  const fallback: QueryClassificationResult = {
    priority: "MEDIUM",
    reason: "Standard priority assigned (System safe fallback)",
    source: "FALLBACK",
  };

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    // Graceful fallback when GEMINI_API_KEY is not configured
    return fallback;
  }

  // Sanitize minimal textual content (privacy guarantee: no credentials or user IDs)
  const cleanTitle = (title || "").trim().slice(0, 300);
  const cleanDescription = (description || "").trim().slice(0, 2000);

  if (!cleanTitle && !cleanDescription) {
    return fallback;
  }

  try {
    const prompt = `You are an academic urgency classifier for an institutional university query system.
Analyze the following student query and classify its urgency strictly into one of three allowed priorities:
- HIGH: Critical blocker, portal submission error, immediate academic emergency, or imminent deadline within 24 hours.
- MEDIUM: Standard coursework questions, concept doubts, assignment questions with normal time remaining.
- LOW: Routine questions, general syllabus inquiries, future schedule clarifications, or optional feedback.

You must respond with ONLY a valid JSON object matching this exact schema:
{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "reason": "Short explanation (1 concise sentence)"
}

Do not include backticks, markdown markers, or explanatory text outside the JSON object.

Student Query Title: ${cleanTitle}
Student Query Details: ${cleanDescription}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Gemini API] Query classification HTTP error: ${response.status} ${response.statusText}`);
      return fallback;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || typeof rawText !== "string") {
      console.warn("[Gemini API] Empty content returned for query classification.");
      return fallback;
    }

    // Strip any accidental markdown formatting
    const cleanedJsonText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJsonText);
    } catch {
      console.warn("[Gemini API] Failed to parse JSON response:", rawText);
      return fallback;
    }

    // Validate structured response
    const priorityUpper = parsed?.priority ? String(parsed.priority).toUpperCase().trim() : "";
    if (!isValidPriority(priorityUpper)) {
      console.warn(`[Gemini API] Invalid priority returned: "${parsed?.priority}". Applying safe fallback MEDIUM.`);
      return fallback;
    }

    const reason = typeof parsed?.reason === "string" && parsed.reason.trim().length > 0
      ? parsed.reason.trim()
      : `Urgency classified as ${priorityUpper}`;

    return {
      priority: priorityUpper,
      reason,
      source: "GEMINI",
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn("[Gemini API] Query classification timed out (6s limit). Applying safe fallback MEDIUM.");
    } else {
      console.warn("[Gemini API] Query classification exception:", error.message || error);
    }
    return fallback;
  }
}

/**
 * Summarizes teacher instruction notes, voice transcriptions, or syllabus outlines
 * into concise, student-friendly academic assignment guidelines.
 * 
 * Privacy: Only pedagogical text, course title, and deadline are provided.
 * Teacher must review and edit the generated guidelines before publishing.
 */
export async function summarizeTeacherInstructions(
  rawInput: string,
  subjectTitle?: string,
  deadline?: string
): Promise<{ guidelines: string; source: "GEMINI" | "HEURISTIC" }> {
  const cleanInput = (rawInput || "").trim();
  if (!cleanInput) {
    return { guidelines: "", source: "HEURISTIC" };
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If API key is available, generate concise structured guidelines with Gemini
  if (apiKey) {
    try {
      const prompt = `You are an academic curriculum assistant helping a professor formulate concise, clear assignment instructions for university students.
Synthesize the provided notes or voice dictation into professional student guidelines.

Course Subject: ${subjectTitle || "Academic Coursework"}
Submission Deadline: ${deadline || "As announced in portal"}

Teacher's Notes / Voice Dictation:
"""
${cleanInput.slice(0, 3000)}
"""

Structure your response with:
Assignment Requirements:
• Specific problem statements or focus topics
• Deliverables and format rules (PDF report, source code, diagrams)
• Documentation or complexity analysis expectations
• Maximum page or length recommendation
• Strict submission deadline

Keep each bullet point actionable, professional, and clear. Return only the formatted guidelines text.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 600,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (generated && generated.length > 20) {
          return { guidelines: generated, source: "GEMINI" };
        }
      }
    } catch (err: any) {
      console.warn("[Gemini API] Teacher guideline generation fallback triggered:", err.message || err);
    }
  }

  // Robust institutional heuristic fallback
  const lines = cleanInput
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const deadlineFormatted = deadline
    ? new Date(deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "As scheduled on university portal";

  const extractedPoints: string[] = [];
  for (const l of lines) {
    if (l.length > 4) {
      const clean = l.replace(/^[-*•\d.)\s]+/, "").trim();
      if (clean) extractedPoints.push(clean);
    }
  }

  if (extractedPoints.length === 0) {
    extractedPoints.push("Address all designated problem statements with formal theoretical derivations");
    extractedPoints.push("Include documented source code with variable descriptions and test cases");
  }

  const hasDiagram = cleanInput.toLowerCase().includes("diagram") || cleanInput.toLowerCase().includes("schematic");
  const hasCode = cleanInput.toLowerCase().includes("code") || cleanInput.toLowerCase().includes("program");

  let fallbackGuidelines = `Assignment Requirements\n\n`;
  for (let i = 0; i < Math.min(extractedPoints.length, 4); i++) {
    fallbackGuidelines += `• ${extractedPoints[i]}\n`;
  }
  fallbackGuidelines += `• Use prescribed institutional academic report format\n`;
  if (hasDiagram) {
    fallbackGuidelines += `• Include clear architectural / schematic diagrams with complete labels\n`;
  }
  if (hasCode) {
    fallbackGuidelines += `• Include execution output screenshots and complexity analysis\n`;
  }
  fallbackGuidelines += `• Maximum 10 pages\n`;
  fallbackGuidelines += `• Submit as PDF before deadline\n`;
  fallbackGuidelines += `• Strict Deadline: ${deadlineFormatted}`;

  return { guidelines: fallbackGuidelines, source: "HEURISTIC" };
}
