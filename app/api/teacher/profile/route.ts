import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Unauthorized access to faculty profile." },
        { status: 403 }
      );
    }

    const teacher = user.teacher;

    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        section: true,
      },
      orderBy: { subject: { code: "asc" } },
    });

    const activeAssignmentsCount = await prisma.assignment.count({
      where: { teacherId: teacher.id, status: "ACTIVE" },
    });

    const totalSubmissionsEvaluated = await prisma.submission.count({
      where: {
        assignment: { teacherId: teacher.id },
        status: "VERIFIED",
      },
    });

    return NextResponse.json({
      profile: {
        id: teacher.id,
        name: user.name,
        email: user.email,
        customId: user.customId || "AT-TEACHER-001",
        employeeId: teacher.employeeId,
        department: teacher.department,
        designation: teacher.designation,
        cabinLocation: teacher.cabinLocation || "Faculty Cabin 204, CS Block B",
        avatar: user.avatar,
        academicYear: "2024-2025",
        status: "Active Faculty Member",
        allocatedSubjects: teacherSubjects.map((ts) => ({
          code: ts.subject.code,
          name: ts.subject.name,
          credits: ts.subject.credits,
          sectionName: ts.section.name,
          isLab: ts.subject.isLab,
        })),
        stats: {
          coursesCount: teacherSubjects.length,
          activeAssignments: activeAssignmentsCount,
          verifiedSubmissions: totalSubmissionsEvaluated,
        },
      },
    });
  } catch (error: any) {
    console.error("Faculty profile API error:", error);
    return NextResponse.json(
      { error: "Failed to load faculty profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Unauthorized access to faculty profile." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { cabinLocation } = body;

    if (!cabinLocation || typeof cabinLocation !== "string" || !cabinLocation.trim()) {
      return NextResponse.json(
        { error: "Please provide a valid location string." },
        { status: 400 }
      );
    }

    const updated = await prisma.teacher.update({
      where: { id: user.teacher.id },
      data: { cabinLocation: cabinLocation.trim() },
    });

    return NextResponse.json({
      success: true,
      message: "Current faculty location updated successfully.",
      cabinLocation: updated.cabinLocation,
    });
  } catch (error: any) {
    console.error("Faculty location update error:", error);
    return NextResponse.json(
      { error: "Failed to update location." },
      { status: 500 }
    );
  }
}

