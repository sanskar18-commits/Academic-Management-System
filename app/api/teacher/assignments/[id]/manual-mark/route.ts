import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Unauthorized access to faculty portal." },
        { status: 403 }
      );
    }

    const assignmentId = params.id;
    const body = await req.json();
    const { rollNumbers } = body; // Expecting string of space-separated roll numbers

    if (!rollNumbers || typeof rollNumbers !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing roll numbers." },
        { status: 400 }
      );
    }

    // Parse roll numbers
    const rollArray = rollNumbers
      .split(/\s+/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (rollArray.length === 0) {
      return NextResponse.json(
        { error: "No valid roll numbers provided." },
        { status: 400 }
      );
    }

    // Verify assignment exists and belongs to the teacher
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { section: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    if (assignment.teacherId !== user.teacher.id) {
      return NextResponse.json(
        { error: "Forbidden. Assignment not allocated to you." },
        { status: 403 }
      );
    }

    // Find all students in the assignment's section
    const sectionStudents = await prisma.student.findMany({
      where: {
        sectionId: assignment.sectionId,
      },
    });

    // Match provided roll numbers (exact, class roll suffix, or numeric equivalency)
    const matchedStudents = new Map<string, typeof sectionStudents[0]>();

    for (const roll of rollArray) {
      const cleanRoll = roll.trim();
      const studentMatch = sectionStudents.find((s) => {
        if (s.rollNumber.toLowerCase() === cleanRoll.toLowerCase()) return true;
        if (s.rollNumber.endsWith(cleanRoll)) return true;
        const sNum = parseInt(s.rollNumber, 10);
        const rNum = parseInt(cleanRoll, 10);
        return !isNaN(sNum) && !isNaN(rNum) && sNum === rNum;
      });

      if (studentMatch) {
        matchedStudents.set(studentMatch.id, studentMatch);
      }
    }

    const students = Array.from(matchedStudents.values());

    if (students.length === 0) {
      return NextResponse.json(
        { error: "None of the provided roll numbers were found in this section." },
        { status: 404 }
      );
    }

    // For each found student, upsert a Submission
    let successCount = 0;
    for (const student of students) {
      await prisma.submission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: assignment.id,
            studentId: student.id,
          },
        },
        update: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        create: {
          assignmentId: assignment.id,
          studentId: student.id,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
      successCount++;
    }

    const notFoundCount = rollArray.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${successCount} submissions. ${
        notFoundCount > 0 ? `(${notFoundCount} roll numbers not found)` : ""
      }`,
      markedCount: successCount,
    });
  } catch (error: any) {
    console.error("Manual mark error:", error);
    return NextResponse.json(
      { error: "Failed to manually mark submissions." },
      { status: 500 }
    );
  }
}
