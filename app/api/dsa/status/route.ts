import { NextResponse } from "next/server";
import { dsaEngine } from "@/server/dsa/dsaService";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: { subject: true },
    });

    const submissions = await prisma.submission.findMany({
      where: { status: "SUBMITTED" },
      include: {
        assignment: { select: { title: true } },
        student: {
          include: {
            user: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
    });

    const scheduled = dsaEngine.prioritizeAssignments(assignments);
    const queue = dsaEngine.buildGradingQueue(submissions);

    return NextResponse.json({
      status: "OPERATIONAL",
      structures: {
        priorityQueue: {
          name: "Deadline Priority Queue (Min-Heap)",
          activeElements: scheduled.length,
          timeComplexity: {
            insert: "O(log N)",
            extractMin: "O(log N)",
            peek: "O(1)",
          },
          topUrgentItem: scheduled[0] || null,
        },
        fifoQueue: {
          name: "Submission Grading Queue (Linked-Node Queue)",
          activeElements: queue.length,
          timeComplexity: {
            enqueue: "O(1)",
            dequeue: "O(1)",
            peek: "O(1)",
          },
          nextInLine: queue[0] || null,
        },
        hashTable: {
          name: "Academic Entity Lookup (Polynomial Rolling Hash)",
          cachedSubjectKeys: dsaEngine.getSubjectCacheSize(),
          loadFactorTarget: 0.75,
          collisionResolution: "Separate Chaining (Buckets)",
          timeComplexity: {
            get: "O(1) average",
            set: "O(1) average",
            delete: "O(1) average",
          },
        },
        cppEngine: dsaEngine.getCppStatus(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
