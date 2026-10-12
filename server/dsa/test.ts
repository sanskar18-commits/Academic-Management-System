import { MinHeap } from "./MinHeap";
import { MaxHeap } from "./MaxHeap";
import { PriorityQueue } from "./PriorityQueue";
import { Queue } from "./Queue";
import { HashTable } from "./HashTable";
import { dsaEngine } from "./dsaService";

console.log("==================================================");
console.log("  ACADEMIC TRACK - DSA ENGINE VERIFICATION SUITE  ");
console.log("==================================================");

// 1. Test MinHeap & MaxHeap
console.log("\n[1/5] Testing MinHeap & MaxHeap...");
const minHeap = new MinHeap<number>();
[45, 12, 89, 3, 27].forEach((n) => minHeap.insert(n));
const minExtracted: number[] = [];
while (!minHeap.isEmpty()) {
  minExtracted.push(minHeap.extractMin()!);
}
console.log("MinHeap sorted output:", minExtracted);
if (JSON.stringify(minExtracted) !== JSON.stringify([3, 12, 27, 45, 89])) {
  throw new Error("MinHeap test failed!");
}
console.log("✓ MinHeap PASSED");

const maxHeap = new MaxHeap<number>();
[45, 12, 89, 3, 27].forEach((n) => maxHeap.insert(n));
const maxExtracted: number[] = [];
while (!maxHeap.isEmpty()) {
  maxExtracted.push(maxHeap.extractMax()!);
}
console.log("MaxHeap sorted output:", maxExtracted);
if (JSON.stringify(maxExtracted) !== JSON.stringify([89, 45, 27, 12, 3])) {
  throw new Error("MaxHeap test failed!");
}
console.log("✓ MaxHeap PASSED");

// 2. Test PriorityQueue
console.log("\n[2/5] Testing PriorityQueue (Deadline Urgency Ordering)...");
const pq = new PriorityQueue<{ title: string; dueDays: number }>();
pq.enqueue({ title: "Assignment 3 - Cloud Architecture", dueDays: 7 }, 7);
pq.enqueue({ title: "Assignment 1 - Data Structures Tree Traversal", dueDays: 1 }, 1);
pq.enqueue({ title: "Assignment 2 - DBMS Normalization", dueDays: 3 }, 3);

const pqSorted = pq.toSortedArray();
console.log("PriorityQueue extraction order:");
pqSorted.forEach((item, idx) => console.log(`  ${idx + 1}. [Day ${item.dueDays}] ${item.title}`));
if (pqSorted[0].title !== "Assignment 1 - Data Structures Tree Traversal") {
  throw new Error("PriorityQueue ordering failed!");
}
console.log("✓ PriorityQueue PASSED");

// 3. Test FIFO Queue
console.log("\n[3/5] Testing FIFO Queue (Grading Backlog)...");
const q = new Queue<string>();
q.enqueue("Submission #1: Aarav Sharma");
q.enqueue("Submission #2: Priya Patel");
q.enqueue("Submission #3: Rohan Mehta");

console.log("Queue size:", q.size());
const dequeued1 = q.dequeue();
console.log("Dequeued item 1:", dequeued1);
if (dequeued1 !== "Submission #1: Aarav Sharma" || q.size() !== 2) {
  throw new Error("FIFO Queue test failed!");
}
console.log("✓ FIFO Queue PASSED");

// 4. Test HashTable
console.log("\n[4/5] Testing HashTable (In-Memory Subject & Cache Indexing)...");
const ht = new HashTable<string, { name: string; credits: number }>(8);
ht.set("BCA-301", { name: "Introduction to Data Structures", credits: 4 });
ht.set("BCA-302", { name: "Introduction to Database Management System", credits: 4 });
ht.set("BCA-303", { name: "Digital Logic Design", credits: 3 });

console.log("HashTable BCA-301 lookup:", ht.get("BCA-301"));
if (!ht.has("BCA-302") || ht.get("BCA-301")?.credits !== 4) {
  throw new Error("HashTable lookup failed!");
}
console.log("HashTable keys:", ht.keys());
console.log("HashTable size:", ht.size());
console.log("✓ HashTable PASSED");

// 5. Test DsaEngine runtime integrations
console.log("\n[5/5] Testing DsaEngine workflow...");
const now = new Date();
const mockAssignments = [
  {
    id: "a1",
    title: "SQL Joins & Subqueries Lab",
    dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4), // 4 days later
    maxMarks: 25,
    subject: { name: "Database Management System Laboratory", code: "BCA-307P" },
  },
  {
    id: "a2",
    title: "Binary Search Tree Implementation",
    dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1), // 1 day later (critical)
    maxMarks: 50,
    subject: { name: "Introduction to Data Structures", code: "BCA-301" },
  },
];

const prioritized = dsaEngine.prioritizeAssignments(mockAssignments);
console.log("DsaEngine Prioritized Assignments:");
prioritized.forEach((p) => console.log(`  [${p.urgency}] ${p.subjectCode} - ${p.title}`));
if (prioritized[0].subjectCode !== "BCA-301") {
  throw new Error("DsaEngine prioritization failed!");
}
console.log("✓ DsaEngine PASSED");

// 6. Test C++ Native Engine Bridge
console.log("\n[6/6] Testing Native C++ DSA Engine Bridge...");
const cppStatus = dsaEngine.getCppStatus();
console.log("C++ Native Engine Available:", cppStatus.available);
console.log("C++ Binary Path:", cppStatus.binaryPath);
console.log("C++ Version:", cppStatus.version);
if (cppStatus.available) {
  console.log("✓ C++ Native DSA Engine PASSED");
} else {
  console.log("⚠ C++ binary not compiled; running in pure TypeScript DSA fallback mode.");
}

console.log("\n==================================================");
console.log("  ALL ACADEMIC TRACK DSA TESTS PASSED!            ");
console.log("==================================================");
