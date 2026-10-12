import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dsaEngine } from "@/server/dsa/dsaService";

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

    // 1. Fetch Teacher's Allocated Subjects & Sections
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        section: true,
      },
      orderBy: { subject: { code: "asc" } },
    });

    // 2. Fetch Assignments created by this teacher
    const assignments = await prisma.assignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        section: true,
        submissions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch Pending (Un-graded) Submissions for this teacher's assignments
    const rawSubmissions = await prisma.submission.findMany({
      where: {
        assignment: { teacherId: teacher.id },
        status: "SUBMITTED",
      },
      include: {
        assignment: { select: { title: true } },
        student: {
          include: {
            user: { select: { name: true, email: true } },
            section: { select: { name: true } },
          },
        },
      },
    });

    // 4. Use Custom DSA Queue (FIFO) to structure grading backlog
    const gradingQueue = dsaEngine.buildGradingQueue(rawSubmissions);

    // 5. Fetch Queries assigned to this teacher
    const queries = await prisma.query.findMany({
      where: { teacherId: teacher.id },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            section: { select: { name: true } },
          },
        },
        subject: true,
        responses: {
          include: {
            user: { select: { name: true, role: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Available sections for selector (populated with demo section)
    const availableSections = await prisma.section.findMany({
      orderBy: { name: "asc" },
    });

    // Total submissions count across all assignments of this teacher
    const totalSubmissionsCount = assignments.reduce((acc, curr) => acc + curr.submissions.length, 0);

    // Prioritize queries using DSA Priority Queue (Min-Heap)
    const prioritizedQueries = dsaEngine.prioritizeQueries(queries);
    const highPriorityQueriesCount = queries.filter(
      (q) => q.status === "OPEN" && (q.priority === "HIGH" || q.priority === "URGENT")
    ).length;

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        customId: user.customId || "AT-TEACHER-001",
        name: user.name,
        email: user.email,
        employeeId: teacher.employeeId,
        department: teacher.department,
        designation: teacher.designation,
        cabinLocation: teacher.cabinLocation || "Faculty Wing",
        avatar: user.avatar,
      },
      allocatedSubjects: teacherSubjects.map((ts) => ({
        id: ts.subject.id,
        code: ts.subject.code,
        name: ts.subject.name,
        credits: ts.subject.credits,
        isLab: ts.subject.isLab,
        section: ts.section.name,
        academicYear: ts.academicYear,
        semester: ts.semester,
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        subjectCode: a.subject.code,
        subjectName: a.subject.name,
        sectionName: a.section.name,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        status: a.status,
        submissionCount: a.submissions.length,
      })),
      gradingQueue,
      queries: prioritizedQueries.map((q) => ({
        id: q.id,
        queryCode: q.queryCode || `QRY-${q.id.substring(0, 8).toUpperCase()}`,
        title: q.title,
        question: q.question,
        status: q.status,
        priority: q.priority === "URGENT" ? "HIGH" : q.priority === "ROUTINE" ? "LOW" : q.priority || "MEDIUM",
        createdAt: q.createdAt,
        studentName: q.student.user.name,
        studentRoll: q.student.rollNumber,
        sectionName: q.student.section.name,
        subjectCode: q.subject.code,
        subjectName: q.subject.name,
        responseCount: q.responses.length,
      })),
      availableSections: availableSections.map((s) => ({
        id: s.id,
        name: s.name,
        program: s.program,
        batch: s.batch,
      })),
      metrics: {
        teacherName: user.name,
        teacherId: user.customId || "AT-TEACHER-001",
        subjectsTaughtCount: teacherSubjects.length,
        activeAssignmentsCount: assignments.filter((a) => a.status === "ACTIVE").length,
        pendingSubmissionsCount: gradingQueue.length,
        totalSubmissionsCount,
        unansweredQueriesCount: queries.filter((q) => q.status === "OPEN").length,
        highPriorityQueriesCount,
      },
    });
  } catch (error: any) {
    console.error("Teacher dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load teacher dashboard." },
      { status: 500 }
    );
  }
}
