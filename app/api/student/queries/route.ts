import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyStudentQuery } from "@/lib/gemini";
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

    const queries = await prisma.query.findMany({
      where: { studentId: student.id },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        assignment: {
          select: { id: true, title: true },
        },
        responses: {
          include: {
            user: { select: { name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = queries.map((q) => {
      const p = (q.priority || "").toUpperCase();
      const normalizedPriority = p === "HIGH" || p === "URGENT" ? "HIGH" : p === "LOW" || p === "ROUTINE" ? "LOW" : "MEDIUM";

      return {
        id: q.id,
        queryCode: q.queryCode || `QRY-${q.id.substring(0, 8).toUpperCase()}`,
        title: q.title,
        question: q.question,
        status: q.status, // "OPEN" | "RESOLVED"
        workflowStep: q.workflowStep, // "SUBMITTED" | "AI_CLASSIFICATION" | "WAITING_FOR_TEACHER" | "ANSWERED"
        systemPriority: normalizedPriority, // "HIGH" | "MEDIUM" | "LOW"
        aiCategory: q.aiCategory || "Academic Inquiry",
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        subject: {
          id: q.subject.id,
          code: q.subject.code,
          name: q.subject.name,
        },
        teacher: {
          name: q.teacher.user.name,
          email: q.teacher.user.email,
          department: q.teacher.department,
        },
        assignment: q.assignment ? { id: q.assignment.id, title: q.assignment.title } : null,
        responses: q.responses.map((r) => ({
          id: r.id,
          author: r.user.name,
          isFaculty: r.user.role === "TEACHER",
          responseText: r.responseText,
          createdAt: r.createdAt,
        })),
      };
    });

    return NextResponse.json({
      queries: formatted,
      totalCount: formatted.length,
      metrics: {
        total: formatted.length,
        open: formatted.filter((q) => q.status === "OPEN").length,
        answered: formatted.filter((q) => q.workflowStep === "ANSWERED").length,
      },
    });
  } catch (error: any) {
    console.error("Queries GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve queries." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "STUDENT" || !user.student) {
      return NextResponse.json(
        { error: "Unauthorized access to student portal." },
        { status: 403 }
      );
    }

    const student = user.student;
    const body = await req.json();
    const { subjectId, assignmentId, title, description } = body;
    let { teacherId } = body;

    if (!subjectId || !title || !description) {
      return NextResponse.json(
        { error: "Please provide subject, title, and query description." },
        { status: 400 }
      );
    }

    let finalSubjectId = subjectId;
    if (subjectId === "PBL_MENTOR" || subjectId === "PBL-MENTOR") {
      let pbl = await prisma.subject.findFirst({ where: { code: "PBL-MENTOR" } });
      if (!pbl) {
        pbl = await prisma.subject.create({
          data: { code: "PBL-MENTOR", name: "PBL (Project Based Learning) Mentor", credits: 2 },
        });
      }
      finalSubjectId = pbl.id;
    } else if (subjectId === "MINI_PROJECT_MENTOR" || subjectId === "MINI-PROJECT") {
      let mp = await prisma.subject.findFirst({ where: { code: "MINI-PROJECT" } });
      if (!mp) {
        mp = await prisma.subject.create({
          data: { code: "MINI-PROJECT", name: "Mini Project Mentor", credits: 2 },
        });
      }
      finalSubjectId = mp.id;
    }

    if (!teacherId) {
      const teacherSubject = await prisma.teacherSubject.findFirst({
        where: { subjectId: finalSubjectId },
        select: { teacherId: true },
      });
      teacherId = teacherSubject?.teacherId;
    }

    if (!teacherId) {
      const defaultTeacher = await prisma.teacher.findFirst({ select: { id: true } });
      teacherId = defaultTeacher?.id;
    }

    // Verify subject is enrolled by student or mentor
    const isMentor = subjectId === "PBL_MENTOR" || subjectId === "MINI_PROJECT_MENTOR" || subjectId === "PBL-MENTOR" || subjectId === "MINI-PROJECT";
    if (!isMentor) {
      const subjectEnrollment = await prisma.sectionSubject.findUnique({
        where: {
          sectionId_subjectId: {
            sectionId: student.sectionId,
            subjectId: finalSubjectId,
          },
        },
      });

      if (!subjectEnrollment) {
        return NextResponse.json(
          { error: "Subject is not part of your enrolled section curriculum." },
          { status: 400 }
        );
      }
    }

    // Generate unique institutional Query ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const queryCode = `QRY-2024-BCA-${randomSuffix}`;

    // =========================================================================
    // QUERY CLASSIFICATION FLOW:
    // Student -> Backend -> Gemini -> Priority Classification -> Our DSA Engine
    // =========================================================================
    // 1. Send strictly minimal text to Gemini API for urgency classification.
    // Privacy: Passwords, credentials, and internal database keys are NEVER sent.
    // Gemini returns structured JSON: { priority: "HIGH"|"MEDIUM"|"LOW", reason: string }.
    // Fault-tolerance: If Gemini returns invalid JSON, missing key, or times out,
    // classifyStudentQuery guarantees fallback { priority: "MEDIUM", ... } without throwing.
    const geminiClassification = await classifyStudentQuery(title, description);

    // 2. Persist query safely in SQL database
    const query = await prisma.query.create({
      data: {
        queryCode,
        studentId: student.id,
        teacherId,
        subjectId: finalSubjectId,
        assignmentId: assignmentId || null,
        title: title.trim(),
        question: description.trim(),
        status: "OPEN",
        workflowStep: "WAITING_FOR_TEACHER",
        priority: geminiClassification.priority, // Strictly HIGH | MEDIUM | LOW
        aiCategory: geminiClassification.reason,
      },
      include: {
        subject: true,
        teacher: { include: { user: true } },
      },
    });

    // 3. Process through our custom DSA Engine
    // IMPORTANT: Gemini does NOT decide queue ordering. Gemini only classifies urgency.
    // Our custom in-memory Priority Queue (Min-Heap) performs the actual ordering.
    // Data consistency guarantee: SQL query created -> DSA queue contains it.
    const queuePosition = await dsaEngine.onQueryCreated(query);

    // Create student notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Academic Query Dispatched",
        message: `Your query '${title}' (${queryCode}) has been classified as ${geminiClassification.priority} priority and placed in queue position #${queuePosition} for ${query.teacher.user.name}.`,
        type: "QUERY_ANSWERED",
        link: "/student/queries",
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Query registered successfully with ID: ${queryCode}`,
      query: {
        id: query.id,
        queryCode: query.queryCode,
        workflowStep: query.workflowStep,
        systemPriority: query.priority,
        aiCategory: query.aiCategory,
        queuePosition,
      },
    });
  } catch (error: any) {
    console.error("Create query error:", error);
    return NextResponse.json(
      { error: "Failed to submit query." },
      { status: 500 }
    );
  }
}
