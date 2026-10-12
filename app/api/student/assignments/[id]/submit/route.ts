import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateStudentSubmission } from "@/lib/fileSecurity";

export const dynamic = "force-dynamic";

export async function POST(
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

    // Verify assignment exists and belongs to student's section
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subject: true,
        teacher: { include: { user: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    if (assignment.sectionId !== student.sectionId) {
      return NextResponse.json(
        { error: "Forbidden. Assignment not allocated to your section." },
        { status: 403 }
      );
    }



    // Process submission data (JSON or FormData)
    const body = await req.json();
    const { fileName, mimeType, fileSizeBytes, submissionText } = body;

    // Security validation: Only allow PDF files for official submissions, check MIME, size, path traversal
    const securityCheck = validateStudentSubmission(
      fileName,
      mimeType,
      fileSizeBytes || 1024 * 1024
    );

    if (!securityCheck.valid) {
      return NextResponse.json(
        { error: securityCheck.error || "Invalid file." },
        { status: 400 }
      );
    }

    const safeName = securityCheck.sanitizedFilename || `submission_${Date.now()}.pdf`;
    const virtualUrl = `/uploads/submissions/${safeName}`;

    // Upsert submission record
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.id,
          studentId: student.id,
        },
      },
      update: {
        fileName: safeName,
        fileUrl: virtualUrl,
        submissionText: submissionText || null,
        submittedAt: new Date(),
        status: "SUBMITTED",
      },
      create: {
        assignmentId: assignment.id,
        studentId: student.id,
        fileName: safeName,
        fileUrl: virtualUrl,
        submissionText: submissionText || null,
        submittedAt: new Date(),
        status: "SUBMITTED",
      },
    });

    // Create confirmation notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Assignment Submitted Successfully",
        message: `Your work for '${assignment.title}' (${assignment.subject.code}) has been received and queued for evaluation.`,
        type: "SUBMISSION_VERIFIED",
        link: `/student/assignments/${assignment.id}`,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment submitted successfully!",
      submission: {
        id: submission.id,
        fileName: submission.fileName,
        submittedAt: submission.submittedAt,
        status: submission.status,
      },
    });
  } catch (error: any) {
    console.error("Assignment submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit assignment." },
      { status: 500 }
    );
  }
}
