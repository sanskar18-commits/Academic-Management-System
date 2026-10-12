import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dsaEngine } from "@/server/dsa/dsaService";

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
    const now = new Date();

    // Fetch all assignments for this section
    const assignments = await prisma.assignment.findMany({
      where: {
        sectionId: student.sectionId,
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        resources: true,
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Determine accurate academic submission status
    const formatted = assignments.map((a) => {
      const studentSub = a.submissions[0] || null;
      const isPastDue = new Date(a.dueDate) < now;

      let status: "Not Started" | "In Progress" | "Submitted" | "Verified" | "Correction Required" | "Overdue" = "Not Started";

      if (studentSub) {
        if (studentSub.status === "VERIFIED") {
          status = "Verified";
        } else if (studentSub.status === "CORRECTION_REQUIRED") {
          status = "Correction Required";
        } else if (studentSub.status === "SUBMITTED") {
          status = "Submitted";
        } else if (studentSub.status === "IN_PROGRESS") {
          status = "In Progress";
        }
      } else if (isPastDue) {
        status = "Overdue";
      }

      const diffMs = new Date(a.dueDate).getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        instructions: a.instructions,
        assignedDate: a.assignedDate,
        dueDate: a.dueDate,
        daysRemaining,
        isOverdue: isPastDue && !studentSub,
        subject: {
          id: a.subject.id,
          code: a.subject.code,
          name: a.subject.name,
          isLab: a.subject.isLab,
        },
        teacher: {
          name: a.teacher.user.name,
          email: a.teacher.user.email,
          cabinLocation: a.teacher.cabinLocation,
        },
        resourcesCount: a.resources.length,
        status,
        submission: studentSub
          ? {
              id: studentSub.id,
              fileName: studentSub.fileName,
              fileUrl: studentSub.fileUrl,
              submittedAt: studentSub.submittedAt,
              feedback: studentSub.feedback,
            }
          : null,
      };
    });

    return NextResponse.json({
      assignments: formatted,
      totalCount: formatted.length,
      metrics: {
        total: formatted.length,
        notStarted: formatted.filter((a) => a.status === "Not Started").length,
        submitted: formatted.filter((a) => a.status === "Submitted" || a.status === "Verified").length,
        verified: formatted.filter((a) => a.status === "Verified").length,
        overdue: formatted.filter((a) => a.status === "Overdue").length,
      },
    });
  } catch (error: any) {
    console.error("Student assignments API error:", error);
    return NextResponse.json(
      { error: "Failed to load assignments." },
      { status: 500 }
    );
  }
}
