import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTeacherResource } from "@/lib/fileSecurity";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Unauthorized access to teacher portal." },
        { status: 403 }
      );
    }

    const teacher = user.teacher;
    const assignmentId = params.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subject: true,
        section: true,
        resources: true,
        submissions: {
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!assignment || assignment.teacherId !== teacher.id) {
      return NextResponse.json(
        { error: "Assignment not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Unauthorized access to teacher portal." },
        { status: 403 }
      );
    }

    const teacher = user.teacher;
    const assignmentId = params.id;

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing || existing.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      instructions,
      submissionMethod,
      teacherLocation,
      dueDate,
      maxMarks,
      status,
      resources,
    } = body;

    if (resources && Array.isArray(resources)) {
      const validatedResources = [];
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
          assignmentId,
          fileName: val.sanitizedFilename || fileName,
          fileUrl: r.fileUrl || `/uploads/resources/${val.sanitizedFilename || fileName}`,
          fileType: val.normalizedMime || r.fileType || "application/pdf",
          resourceType: val.detectedType || "PDF",
          fileSize: r.fileSize || "1.5 MB",
        });
      }

      await prisma.assignmentResource.deleteMany({
        where: { assignmentId },
      });
      if (validatedResources.length > 0) {
        await prisma.assignmentResource.createMany({
          data: validatedResources,
        });
      }
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: title ? title.trim() : existing.title,
        description: description ? description.trim() : existing.description,
        instructions: instructions !== undefined ? instructions : existing.instructions,
        submissionMethod: submissionMethod || existing.submissionMethod,
        teacherLocation: teacherLocation || existing.teacherLocation,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        maxMarks: maxMarks ? Number(maxMarks) : existing.maxMarks,
        status: status || existing.status,
      },
      include: {
        resources: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment updated successfully!",
      assignment: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const teacher = user.teacher;
    const assignmentId = params.id;
    const { action } = await req.json(); // "PUBLISH" | "ARCHIVE"

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing || existing.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const newStatus = action === "ARCHIVE" ? "ARCHIVED" : "ACTIVE";
    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: `Assignment status updated to ${newStatus}.`,
      assignment: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const teacher = user.teacher;
    const assignmentId = params.id;

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing || existing.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
