import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTeacherResource } from "@/lib/fileSecurity";

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

    const assignments = await prisma.assignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        section: true,
        resources: true,
        submissions: {
          select: { id: true, status: true, marksAwarded: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      instructions: a.instructions,
      submissionMethod: a.submissionMethod,
      teacherLocation: a.teacherLocation,
      assignedDate: a.assignedDate,
      dueDate: a.dueDate,
      maxMarks: a.maxMarks,
      status: a.status,
      subject: {
        id: a.subject.id,
        code: a.subject.code,
        name: a.subject.name,
      },
      section: {
        id: a.section.id,
        name: a.section.name,
      },
      resources: a.resources,
      submissionsCount: a.submissions.length,
      evaluatedCount: a.submissions.filter((s) => s.status === "VERIFIED").length,
    }));

    return NextResponse.json({
      assignments: formatted,
      totalCount: formatted.length,
    });
  } catch (error: any) {
    console.error("Teacher assignments GET error:", error);
    return NextResponse.json(
      { error: "Failed to load assignments." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const {
      title,
      subjectId,
      sectionId,
      description,
      instructions,
      submissionMethod,
      teacherLocation,
      dueDate,
      maxMarks,
      status = "ACTIVE",
      resources = [],
    } = body;

    if (!title || !subjectId || !sectionId || !description || !dueDate) {
      return NextResponse.json(
        { error: "Please fill out all required assignment fields." },
        { status: 400 }
      );
    }

        // Validate all attached coursework resources (PDF, Images, Video strictly)
        const validatedResources = [];
        if (Array.isArray(resources)) {
          for (const r of resources) {
            const fileName = r.fileName || r.title || "resource.pdf";
            const val = validateTeacherResource(fileName, r.fileType);
            if (!val.valid) {
              return NextResponse.json(
                { error: `Resource '${fileName}': ${val.error}` },
                { status: 400 }
              );
            }
            validatedResources.push({
              fileName: val.sanitizedFilename || fileName,
              fileUrl: r.fileUrl || `/uploads/resources/${val.sanitizedFilename || fileName}`,
              fileType: val.normalizedMime || r.fileType || "application/pdf",
              resourceType: val.detectedType || "PDF",
              fileSize: r.fileSize || "1.5 MB",
            });
          }
        }

        const assignment = await prisma.assignment.create({
          data: {
            title: title.trim(),
            subjectId,
            teacherId: teacher.id,
            sectionId,
            description: description.trim(),
            instructions: instructions ? instructions.trim() : null,
            submissionMethod: submissionMethod || "ONLINE",
            teacherLocation: teacherLocation || teacher.cabinLocation || "Faculty Cabin",
            dueDate: new Date(dueDate),
            maxMarks: Number(maxMarks) || 100,
            status, // "ACTIVE" or "DRAFT"
            resources: {
              create: validatedResources,
            },
          },
          include: {
            subject: true,
            section: true,
          },
        });

    // If published/active, create notification for students enrolled in that section
    if (status === "ACTIVE") {
      const sectionStudents = await prisma.student.findMany({
        where: { sectionId },
        select: { userId: true },
      });

      for (const st of sectionStudents) {
        await prisma.notification.create({
          data: {
            userId: st.userId,
            title: `New Assignment: ${assignment.subject.code}`,
            message: `${user.name} published '${assignment.title}'. Due on ${new Date(dueDate).toLocaleDateString()}.`,
            type: "NEW_ASSIGNMENT",
            link: `/student/assignments/${assignment.id}`,
            read: false,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Assignment '${assignment.title}' created successfully!`,
      assignmentId: assignment.id,
    });
  } catch (error: any) {
    console.error("Create assignment error:", error);
    return NextResponse.json(
      { error: "Failed to create assignment." },
      { status: 500 }
    );
  }
}
