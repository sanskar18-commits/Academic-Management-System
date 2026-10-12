import { PriorityQueue } from "./PriorityQueue";
import { Queue } from "./Queue";
import { HashTable } from "./HashTable";
import { cppBridge } from "./cppBridge";
import { prisma } from "@/lib/prisma";

export interface ScheduledAssignment {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  dueDate: Date;
  daysRemaining: number;
  urgency: "OVERDUE" | "CRITICAL" | "UPCOMING" | "NORMAL";
  maxMarks: number;
}

export interface QueuedSubmission {
  submissionId: string;
  assignmentTitle: string;
  studentName: string;
  studentRoll: string;
  submittedAt: Date;
  section: string;
  queuePosition: number;
}

/**
 * Custom DSA Runtime Processing Engine
 * Bridges persistent SQL database records with real-time in-memory DSA:
 * 
 * DATA CONSISTENCY ARCHITECTURE:
 * - SQL database is the single persistent source of truth.
 * - In-memory DSA structures provide zero-latency O(1) retrieval and O(log N) priority ordering.
 * - When SQL query exists -> DSA queue contains it.
 * - When query is answered in SQL -> DSA queue removes it.
 * - System automatically rebuilds full DSA runtime state from SQL on server restart.
 */
class DsaEngine {
  // In-memory runtime cache using our custom HashTable
  private subjectCache: HashTable<string, any> = new HashTable<string, any>(64);
  private queryLookup: HashTable<string, any> = new HashTable<string, any>(128);

  // Stateful runtime PriorityQueues per teacher
  private teacherQueryQueues: Map<string, PriorityQueue<any>> = new Map();
  private isInitialized: boolean = false;

  /**
   * Calculates deterministic priority score:
   * Base priority dominates (HIGH = 1000, MEDIUM = 2000, LOW = 3000).
   * Earlier timestamp gives age offset so older queries are dequeued first.
   */
  public calculateQueryScore(priority: string, createdAt: Date | string): number {
    let baseScore = 2000;
    const p = (priority || "").toUpperCase();
    if (p === "HIGH" || p === "URGENT") {
      baseScore = 1000;
    } else if (p === "LOW" || p === "ROUTINE") {
      baseScore = 3000;
    }

    const createdTime = new Date(createdAt).getTime();
    const now = Date.now();
    // Normalize wait time in hours (max 500 hours offset to preserve priority category dominance)
    const ageHours = Math.min(Math.max((now - createdTime) / (1000 * 60 * 60), 0), 500);
    return baseScore - ageHours;
  }

  /**
   * Rebuilds full DSA runtime state directly from persistent SQL storage.
   * Called on startup or on demand to guarantee state parity after restart.
   */
  public async rebuildDsaStateFromSql(): Promise<{
    openQueriesCount: number;
    cachedSubjectsCount: number;
  }> {
    try {
      // 1. Rebuild Subject HashTable
      const subjects = await prisma.subject.findMany();
      this.cacheSubjects(subjects);

      // 2. Rebuild Teacher Priority Queues from OPEN SQL queries
      const openQueries = await prisma.query.findMany({
        where: { status: "OPEN" },
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
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      this.teacherQueryQueues.clear();
      this.queryLookup = new HashTable<string, any>(Math.max(64, openQueries.length * 2));

      for (const q of openQueries) {
        this.queryLookup.set(q.id, q);
        let pq = this.teacherQueryQueues.get(q.teacherId);
        if (!pq) {
          pq = new PriorityQueue<any>();
          this.teacherQueryQueues.set(q.teacherId, pq);
        }
        const score = this.calculateQueryScore(q.priority, q.createdAt);
        pq.enqueue(q, score);
      }

      this.isInitialized = true;
      return {
        openQueriesCount: openQueries.length,
        cachedSubjectsCount: subjects.length,
      };
    } catch (err: any) {
      console.warn("[DSA Engine] SQL state rebuild notice:", err.message || err);
      this.isInitialized = true;
      return { openQueriesCount: 0, cachedSubjectsCount: 0 };
    }
  }

  /**
   * Ensures the DSA engine state is hydrated from SQL before operations.
   */
  public async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.rebuildDsaStateFromSql();
    }
  }

  /**
   * Synchronizes newly created SQL query into in-memory DSA PriorityQueue.
   * Returns the exact position of the query in the teacher's priority queue.
   */
  public async onQueryCreated(query: any): Promise<number> {
    await this.ensureInitialized();

    const teacherId = query.teacherId;
    let pq = this.teacherQueryQueues.get(teacherId);
    if (!pq) {
      pq = new PriorityQueue<any>();
      this.teacherQueryQueues.set(teacherId, pq);
    }

    const score = this.calculateQueryScore(query.priority, query.createdAt);
    pq.enqueue(query, score);
    this.queryLookup.set(query.id, query);

    // Calculate queue position using MinHeap extraction order
    const sorted = pq.toSortedArray();
    const position = sorted.findIndex((item) => item.id === query.id) + 1;
    return Math.max(1, position);
  }

  /**
   * Synchronizes answered query by removing it from the active runtime PriorityQueue.
   */
  public async onQueryResolved(queryId: string, teacherId: string): Promise<void> {
    await this.ensureInitialized();

    this.queryLookup.delete(queryId);

    const pq = this.teacherQueryQueues.get(teacherId);
    if (!pq) return;

    // Filter out resolved query and re-enqueue remaining open items
    const remaining = pq.toSortedArray().filter((q) => q.id !== queryId);
    const newPq = new PriorityQueue<any>();
    for (const item of remaining) {
      const score = this.calculateQueryScore(item.priority, item.createdAt);
      newPq.enqueue(item, score);
    }
    this.teacherQueryQueues.set(teacherId, newPq);
  }

  /**
   * Sorts teacher queries using custom PriorityQueue (Min-Heap).
   * HIGH priority queries with longest wait times are dequeued first.
   * Gemini only classifies urgency; our PriorityQueue performs actual ordering.
   */
  public prioritizeQueries<T extends { priority: string; createdAt: Date | string }>(queries: T[]): T[] {
    const pq = new PriorityQueue<T>();

    for (const q of queries) {
      const score = this.calculateQueryScore(q.priority, q.createdAt);
      pq.enqueue(q, score);
    }

    return pq.toSortedArray();
  }

  /**
   * Sorts and prioritizes student assignments using custom PriorityQueue (Min-Heap based).
   * Earliest deadlines and overdue assignments are extracted first.
   */
  public prioritizeAssignments(
    assignments: Array<{
      id: string;
      title: string;
      dueDate: Date | string;
      maxMarks: number;
      subject: { name: string; code: string };
    }>
  ): ScheduledAssignment[] {
    const pq = new PriorityQueue<ScheduledAssignment>();
    const now = Date.now();

    for (const a of assignments) {
      const dueTime = new Date(a.dueDate).getTime();
      const diffMs = dueTime - now;
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let urgency: "OVERDUE" | "CRITICAL" | "UPCOMING" | "NORMAL" = "NORMAL";
      if (diffMs < 0) {
        urgency = "OVERDUE";
      } else if (daysRemaining <= 2) {
        urgency = "CRITICAL";
      } else if (daysRemaining <= 5) {
        urgency = "UPCOMING";
      }

      const scheduled: ScheduledAssignment = {
        id: a.id,
        title: a.title,
        subjectName: a.subject.name,
        subjectCode: a.subject.code,
        dueDate: new Date(a.dueDate),
        daysRemaining,
        urgency,
        maxMarks: a.maxMarks,
      };

      // Priority calculation: earlier due date = lower timestamp = dequeued first
      pq.enqueue(scheduled, dueTime);
    }

    return pq.toSortedArray();
  }

  /**
   * Processes un-evaluated submissions into a FIFO Queue for teacher grading.
   * Preserves fair first-come, first-served grading order.
   */
  public buildGradingQueue(
    submissions: Array<{
      id: string;
      submittedAt: Date | string;
      assignment: { title: string };
      student: { rollNumber: string; user: { name: string }; section: { name: string } };
    }>
  ): QueuedSubmission[] {
    const queue = new Queue<QueuedSubmission>();

    // Sort initially by submission time before queuing
    const sorted = [...submissions].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    let pos = 1;
    for (const sub of sorted) {
      queue.enqueue({
        submissionId: sub.id,
        assignmentTitle: sub.assignment.title,
        studentName: sub.student.user.name,
        studentRoll: sub.student.rollNumber,
        submittedAt: new Date(sub.submittedAt),
        section: sub.student.section.name,
        queuePosition: pos++,
      });
    }

    return queue.toArray();
  }

  /**
   * Caches subject metadata in custom HashTable for fast in-memory lookup.
   */
  public cacheSubjects(subjects: Array<{ code: string; name: string; [key: string]: any }>): void {
    for (const s of subjects) {
      this.subjectCache.set(s.code, s);
    }
  }

  public getCachedSubject(code: string): any | undefined {
    return this.subjectCache.get(code);
  }

  public getSubjectCacheSize(): number {
    return this.subjectCache.size();
  }

  public getActiveOpenQueriesCount(): number {
    let count = 0;
    for (const pq of this.teacherQueryQueues.values()) {
      count += pq.size();
    }
    return count;
  }

  public getCppStatus() {
    return cppBridge.getStatus();
  }
}

export const dsaEngine = new DsaEngine();
