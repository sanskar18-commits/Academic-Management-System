import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dsaEngine } from "@/server/dsa/dsaService";

export const dynamic = "force-dynamic";

function calculateWaitingTime(createdAt: Date | string): string {
  const diffMs = new Date().getTime() - new Date(createdAt).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ago`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.max(minutes, 1)}m ago`;
}

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
    await dsaEngine.ensureInitialized();

    const queries = await prisma.query.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        student: {
          include: {
            user: { select: { name: true, email: true } },
            section: { select: { name: true } },
          },
        },
        assignment: { select: { id: true, title: true } },
        responses: {
          include: {
            user: { select: { name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // ORDERING MUST COME FROM CUSTOM DSA PRIORITY QUEUE
    const prioritized = dsaEngine.prioritizeQueries(queries);

    const formatted = prioritized.map((q) => {
      const p = (q.priority || "").toUpperCase();
      const normalizedPriority: "HIGH" | "MEDIUM" | "LOW" =
        p === "HIGH" || p === "URGENT" ? "HIGH" : p === "LOW" || p === "ROUTINE" ? "LOW" : "MEDIUM";

      return {
        id: q.id,
        queryCode: q.queryCode || `QRY-${q.id.substring(0, 8).toUpperCase()}`,
        title: q.title,
        question: q.question,
        priority: normalizedPriority,
        waitingTime: calculateWaitingTime(q.createdAt),
        createdAt: q.createdAt,
        status: q.status, // "OPEN" | "RESOLVED"
        workflowStep: q.workflowStep,
        aiCategory: q.aiCategory || "Academic Question",
        student: {
          id: q.student.id,
          name: q.student.user.name,
          rollNumber: q.student.rollNumber,
          email: q.student.user.email,
          sectionName: q.student.section.name,
        },
        subject: {
          id: q.subject.id,
          code: q.subject.code,
          name: q.subject.name,
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
      openCount: formatted.filter((q) => q.status === "OPEN").length,
      highPriorityCount: formatted.filter((q) => q.status === "OPEN" && q.priority === "HIGH").length,
      resolvedCount: formatted.filter((q) => q.status === "RESOLVED").length,
    });
  } catch (error: any) {
    console.error("Teacher queries GET error:", error);
    return NextResponse.json(
      { error: "Failed to load queries." },
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
    const { queryId, responseText } = await req.json();

    if (!queryId || !responseText || !responseText.trim()) {
      return NextResponse.json(
        { error: "Please provide a valid query ID and response message." },
        { status: 400 }
      );
    }

    const query = await prisma.query.findUnique({
      where: { id: queryId },
      include: {
        student: { include: { user: true } },
        subject: true,
      },
    });

    if (!query || query.teacherId !== teacher.id) {
      return NextResponse.json(
        { error: "Query not found or unauthorized." },
        { status: 404 }
      );
    }

    // 1. Save response in SQL (QueryResponse table)
    const response = await prisma.queryResponse.create({
      data: {
        queryId,
        userId: user.id,
        responseText: responseText.trim(),
      },
    });

    // 2. Update query status in SQL to RESOLVED & workflowStep to ANSWERED
    const updatedQuery = await prisma.query.update({
      where: { id: queryId },
      data: {
        status: "RESOLVED",
        workflowStep: "ANSWERED",
      },
    });

    // 3. Synchronize in-memory runtime DSA PriorityQueue (Data consistency guarantee)
    await dsaEngine.onQueryResolved(queryId, teacher.id);

    // 4. Notify student
    await prisma.notification.create({
      data: {
        userId: query.student.userId,
        title: `Faculty Answered: ${query.queryCode || query.title}`,
        message: `${user.name} responded: "${responseText.trim().substring(0, 100)}..."`,
        type: "QUERY_ANSWERED",
        link: "/student/queries",
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Response recorded and query resolved in SQL and active queue!",
      response,
      query: updatedQuery,
    });
  } catch (error: any) {
    console.error("Answer query error:", error);
    return NextResponse.json(
      { error: "Failed to answer query." },
      { status: 500 }
    );
  }
}
