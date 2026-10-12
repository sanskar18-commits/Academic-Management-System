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

    // 1. Fetch Section Details
    const section = await prisma.section.findUnique({
      where: { id: student.sectionId },
    });

    // 2. Fetch Subjects strictly assigned to this student's section (Never hardcoded)
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
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    // Cache subjects in our custom HashTable
    dsaEngine.cacheSubjects(subjects);

    // 3. Fetch Assignments for this section
    const rawAssignments = await prisma.assignment.findMany({
      where: {
        sectionId: student.sectionId,
        status: "ACTIVE",
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
        resources: true,
        submissions: {
          where: { studentId: student.id },
        },
      },
    });

    // 4. Use Custom DSA PriorityQueue (Min-Heap) to sort assignments by urgency
    const prioritizedAssignments = dsaEngine.prioritizeAssignments(
      rawAssignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        subject: { name: a.subject.name, code: a.subject.code },
      }))
    );

    // Merge submission status with prioritized assignments
    const assignmentsWithStatus = prioritizedAssignments.map((pa) => {
      const original = rawAssignments.find((r) => r.id === pa.id);
      const studentSub = original?.submissions[0] || null;
      return {
        ...pa,
        description: original?.description,
        teacherName: original?.teacher.user.name,
        resources: original?.resources || [],
        isSubmitted: !!studentSub,
        submission: studentSub,
      };
    });

    // 5. Fetch Student's Submissions
    const submissions = await prisma.submission.findMany({
      where: { studentId: student.id },
      include: {
        assignment: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // 6. Fetch Student's Academic Queries
    const queries = await prisma.query.findMany({
      where: { studentId: student.id },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
        responses: {
          include: {
            user: { select: { name: true, role: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      student: {
        id: student.id,
        customId: user.customId || "AT-STUDENT-001",
        name: user.name,
        email: user.email,
        rollNumber: student.rollNumber,
        semester: student.semester,
        admissionYear: student.admissionYear,
        avatar: user.avatar,
        section: section ? { id: section.id, name: section.name, program: section.program } : null,
      },
      subjects: subjects.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        credits: s.credits,
        isLab: s.isLab,
        faculty: s.teacherSubjects[0]?.teacher.user.name || "Faculty Assigned",
      })),
      prioritizedAssignments: assignmentsWithStatus,
      submissions,
      queries,
      metrics: {
        totalSubjects: subjects.length,
        activeAssignments: rawAssignments.length,
        pendingAssignments: assignmentsWithStatus.filter((a) => !a.isSubmitted).length,
        upcomingDeadlines: assignmentsWithStatus.filter((a) => !a.isSubmitted && a.daysRemaining >= 0).length,
        submittedAssignments: submissions.length,
        activeQueries: queries.filter((q) => q.status === "OPEN").length,
      },
    });
  } catch (error: any) {
    console.error("Student dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load student dashboard." },
      { status: 500 }
    );
  }
}
