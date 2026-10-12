import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Unauthorized access to teacher portal." },
        { status: 403 }
      );
    }

    const teacher = user.teacher;

    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        section: {
          include: {
            _count: { select: { students: true } },
          },
        },
      },
      orderBy: { subject: { code: "asc" } },
    });

    const formatted = await Promise.all(
      teacherSubjects.map(async (ts) => {
        const activeAssignmentsCount = await prisma.assignment.count({
          where: {
            teacherId: teacher.id,
            subjectId: ts.subjectId,
            sectionId: ts.sectionId,
            status: "ACTIVE",
          },
        });

        return {
          id: ts.subject.id,
          subjectId: ts.subject.id,
          sectionId: ts.section.id,
          code: ts.subject.code,
          name: ts.subject.name,
          credits: ts.subject.credits,
          isLab: ts.subject.isLab,
          sectionName: ts.section.name,
          enrolledStudentsCount: ts.section._count.students,
          academicYear: ts.academicYear,
          semester: ts.semester,
          cabinLocation: teacher.cabinLocation || "Faculty Wing",
          activeAssignmentsCount,
        };
      })
    );

    return NextResponse.json({
      subjects: formatted,
      totalCount: formatted.length,
    });
  } catch (error: any) {
    console.error("Teacher subjects API error:", error);
    return NextResponse.json(
      { error: "Failed to load allocated subjects." },
      { status: 500 }
    );
  }
}
