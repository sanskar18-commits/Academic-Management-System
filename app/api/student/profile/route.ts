import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "STUDENT" || !user.student) {
      return NextResponse.json(
        { error: "Unauthorized access to profile." },
        { status: 403 }
      );
    }

    const student = user.student;
    const section = student.section;

    const subjectsCount = await prisma.sectionSubject.count({
      where: { sectionId: student.sectionId },
    });

    const submissionsCount = await prisma.submission.count({
      where: { studentId: student.id },
    });

    return NextResponse.json({
      profile: {
        id: student.id,
        name: user.name,
        email: user.email,
        customId: user.customId || "AT-STUDENT-001",
        rollNumber: student.rollNumber,
        semester: student.semester,
        admissionYear: student.admissionYear,
        avatar: user.avatar,
        academicYear: "2024-2025",
        status: "Active & Enrolled",
        section: {
          id: section.id,
          name: section.name,
          program: section.program,
          batch: section.batch,
        },
        stats: {
          enrolledCourses: subjectsCount,
          totalSubmissions: submissionsCount,
          academicStanding: "Good Standing (Dean's List Eligible)",
        },
      },
    });
  } catch (error: any) {
    console.error("Student profile API error:", error);
    return NextResponse.json(
      { error: "Failed to load profile." },
      { status: 500 }
    );
  }
}
