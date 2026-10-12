import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "STUDENT" || !user.student) {
      return NextResponse.json(
        { error: "Unauthorized access to student portal." },
        { status: 403 }
      );
    }

    const student = user.student;

    // Fetch all subjects assigned to student's section
    const subjects = await prisma.subject.findMany({
      where: {
        sectionSubjects: {
          some: { sectionId: student.sectionId },
        },
      },
      orderBy: { code: "asc" },
      include: {
        teacherSubjects: {
          where: { sectionId: student.sectionId },
          include: {
            teacher: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        assignments: {
          where: {
            sectionId: student.sectionId,
            status: "ACTIVE",
          },
          orderBy: { dueDate: "asc" },
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
    });

    const formatted = subjects.map((sub) => {
      const activeAssignments = sub.assignments;
      const nearestAssignment = activeAssignments[0] || null;

      return {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        credits: sub.credits,
        isLab: sub.isLab,
        teacher: {
          id: sub.teacherSubjects[0]?.teacher.id || null,
          name: sub.teacherSubjects[0]?.teacher.user.name || "Faculty Assigned",
          email: sub.teacherSubjects[0]?.teacher.user.email || null,
          cabinLocation: sub.teacherSubjects[0]?.teacher.cabinLocation || "Academic Faculty Wing",
        },
        activeAssignmentsCount: activeAssignments.length,
        nearestDeadline: nearestAssignment
          ? {
              assignmentId: nearestAssignment.id,
              title: nearestAssignment.title,
              dueDate: nearestAssignment.dueDate,
            }
          : null,
      };
    });

    return NextResponse.json({
      sectionName: student.section.name,
      subjects: formatted,
      totalCount: formatted.length,
    });
  } catch (error: any) {
    console.error("Student subjects API error:", error);
    return NextResponse.json(
      { error: "Failed to load enrolled subjects." },
      { status: 500 }
    );
  }
}
