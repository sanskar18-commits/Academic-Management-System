import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "STUDENT" || !user.student) {
      return NextResponse.json(
        { error: "Unauthorized access to student portal." },
        { status: 403 }
      );
    }

    const student = user.student;
    const assignmentId = params.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
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
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    // Security check: ensure assignment belongs to student's section
    if (assignment.sectionId !== student.sectionId) {
      return NextResponse.json(
        { error: "Access denied. Assignment is not allocated to your section." },
        { status: 403 }
      );
    }

    const now = new Date();
    const studentSub = assignment.submissions[0] || null;
    const isPastDue = new Date(assignment.dueDate) < now;

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

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        submissionMethod: assignment.submissionMethod, // "ONLINE" | "PHYSICAL"
        teacherLocation: assignment.teacherLocation || assignment.teacher.cabinLocation || "Faculty Cabin",
        assignedDate: assignment.assignedDate,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks,
        status,
        subject: {
          id: assignment.subject.id,
          code: assignment.subject.code,
          name: assignment.subject.name,
          isLab: assignment.subject.isLab,
        },
        teacher: {
          name: assignment.teacher.user.name,
          email: assignment.teacher.user.email,
          designation: assignment.teacher.designation,
          department: assignment.teacher.department,
          cabinLocation: assignment.teacher.cabinLocation,
        },
        resources: assignment.resources.map((r) => ({
          id: r.id,
          fileName: r.fileName,
          fileUrl: r.fileUrl,
          fileType: r.fileType,
          resourceType: r.resourceType, // "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT"
          fileSize: r.fileSize,
        })),
        submission: studentSub
          ? {
              id: studentSub.id,
              fileName: studentSub.fileName,
              fileUrl: studentSub.fileUrl,
              submissionText: studentSub.submissionText,
              submittedAt: studentSub.submittedAt,
              marksAwarded: studentSub.marksAwarded,
              feedback: studentSub.feedback,
              status: studentSub.status,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Assignment details API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve assignment details." },
      { status: 500 }
    );
  }
}
