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

    const submissions = await prisma.submission.findMany({
      where: {
        assignment: { teacherId: teacher.id },
      },
      include: {
        assignment: {
          include: {
            subject: true,
          },
        },
        student: {
          include: {
            user: { select: { name: true, email: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    const formatted = submissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment.title,
      subjectCode: s.assignment.subject.code,
      subjectName: s.assignment.subject.name,
      maxMarks: s.assignment.maxMarks,
      studentName: s.student.user.name,
      studentRoll: s.student.rollNumber,
      studentEmail: s.student.user.email,
      sectionName: s.student.section.name,
      submittedAt: s.submittedAt,
      status: s.status, // "SUBMITTED" | "VERIFIED" | "CORRECTION_REQUIRED"
      fileName: s.fileName,
      fileUrl: s.fileUrl,
      submissionText: s.submissionText,
      marksAwarded: s.marksAwarded,
      feedback: s.feedback,
    }));

    return NextResponse.json({
      submissions: formatted,
      totalCount: formatted.length,
      pendingCount: formatted.filter((s) => s.status === "SUBMITTED").length,
      verifiedCount: formatted.filter((s) => s.status === "VERIFIED").length,
      correctionRequiredCount: formatted.filter((s) => s.status === "CORRECTION_REQUIRED").length,
    });
  } catch (error: any) {
    console.error("Teacher submissions GET error:", error);
    return NextResponse.json(
      { error: "Failed to load submissions." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Unauthorized access to teacher portal." },
        { status: 403 }
      );
    }

    const teacher = user.teacher;
    const body = await req.json();
    const { submissionId, action, marksAwarded, feedback } = body;

    if (!submissionId || !action) {
      return NextResponse.json(
        { error: "Please provide submission ID and evaluation action." },
        { status: 400 }
      );
    }

    const existing = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        student: { include: { user: true } },
      },
    });

    if (!existing || existing.assignment.teacherId !== teacher.id) {
      return NextResponse.json(
        { error: "Submission not found or unauthorized." },
        { status: 404 }
      );
    }

    let newStatus = "VERIFIED";
    let notificationTitle = "Assignment Evaluated & Graded";
    let notificationMsg = "";

    if (action === "VERIFY") {
      newStatus = "VERIFIED";
      notificationMsg = `Your submission for '${existing.assignment.title}' was verified. Grade: ${marksAwarded || 0} / ${existing.assignment.maxMarks} Points.`;
    } else if (action === "CORRECTION_REQUIRED") {
      newStatus = "CORRECTION_REQUIRED";
      notificationTitle = "Submission Correction Requested";
      notificationMsg = `Instructor ${user.name} requested corrections on your '${existing.assignment.title}' submission: "${feedback || 'Please review guidelines and re-upload'}"`;
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        marksAwarded: marksAwarded !== undefined ? Number(marksAwarded) : existing.marksAwarded,
        feedback: feedback !== undefined ? feedback.trim() : existing.feedback,
      },
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: existing.student.userId,
        title: notificationTitle,
        message: notificationMsg,
        type: action === "VERIFY" ? "SUBMISSION_VERIFIED" : "DEADLINE_APPROACHING",
        link: `/student/assignments/${existing.assignmentId}`,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: action === "VERIFY" ? "Submission verified successfully!" : "Correction requested successfully.",
      submission: updated,
    });
  } catch (error: any) {
    console.error("Submission evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate submission." },
      { status: 500 }
    );
  }
}
