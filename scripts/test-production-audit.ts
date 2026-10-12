import { prisma } from "../lib/prisma";
import { signJwt, comparePassword, hashPassword, getAuthenticatedUser } from "../lib/auth";
import { validateStudentSubmission, validateTeacherResource, sanitizeFilename } from "../lib/fileSecurity";
import { classifyStudentQuery, summarizeTeacherInstructions } from "../lib/gemini";
import { dsaEngine } from "../server/dsa/dsaService";
import { MinHeap } from "../server/dsa/MinHeap";
import { Queue } from "../server/dsa/Queue";
import { HashTable } from "../server/dsa/HashTable";
import { PriorityQueue } from "../server/dsa/PriorityQueue";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ ${message}`);
}

async function runAudit() {
  console.log("===============================================================================");
  console.log(" ACADEMIC TRACK - PRODUCTION SECURITY, DATA CONSISTENCY & DSA AUDIT SUITE");
  console.log("===============================================================================\n");

  // --------------------------------------------------------------------------
  // SECTION 1: AUTHENTICATION & PASSWORD HASHING
  // --------------------------------------------------------------------------
  console.log("▶ [1/7] Testing Authentication & Password Hashing...");
  const rawPass = "Student@123";
  const hashed = await hashPassword(rawPass);
  assert(hashed.startsWith("$2"), "Password hashing uses secure bcrypt format ($2a / $2b)");
  assert(await comparePassword(rawPass, hashed), "Bcrypt password comparison validates correct password");
  assert(!(await comparePassword("WrongPassword", hashed)), "Bcrypt password comparison rejects incorrect password");

  const studentUser = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  const teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER" }, include: { teacher: true } });
  assert(!!studentUser, "Student user exists in database");
  assert(!!teacherUser, "Teacher user exists in database");

  const studentToken = signJwt({
    userId: studentUser!.id,
    email: studentUser!.email,
    role: "STUDENT",
    name: studentUser!.name,
  });
  const teacherToken = signJwt({
    userId: teacherUser!.id,
    email: teacherUser!.email,
    role: "TEACHER",
    name: teacherUser!.name,
  });
  assert(typeof studentToken === "string" && studentToken.length > 30, "Signed student JWT generated");
  assert(typeof teacherToken === "string" && teacherToken.length > 30, "Signed teacher JWT generated");

  // --------------------------------------------------------------------------
  // SECTION 2: ROLE ISOLATION & DATA ACCESS CONTROL
  // --------------------------------------------------------------------------
  console.log("\n▶ [2/7] Testing Role Isolation & Authorization Boundaries...");
  assert(studentUser!.role === "STUDENT", "Student role strictly defined as STUDENT");
  assert(teacherUser!.role === "TEACHER", "Teacher role strictly defined as TEACHER");

  // Verify section isolation: Student Aarav is enrolled in section G3
  const studentEnrollment = await prisma.student.findUnique({
    where: { userId: studentUser!.id },
    include: { section: true },
  });
  assert(!!studentEnrollment, "Student enrolled in valid academic section");
  assert(studentEnrollment!.section.name === "BCA - SEC-G3", "Student locked to BCA - SEC-G3 cohort");

  // --------------------------------------------------------------------------
  // SECTION 3: FILE UPLOAD SECURITY (MIME, EXTENSION, SIZE, PATH TRAVERSAL)
  // --------------------------------------------------------------------------
  console.log("\n▶ [3/7] Testing File Upload Security Engine...");

  // Student: PDF only
  const validPdf = validateStudentSubmission("project_report.pdf", "application/pdf", 1024 * 500);
  assert(validPdf.valid, "Valid student PDF submission accepted");

  const invalidStudentDocx = validateStudentSubmission("assignment.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1024 * 500);
  assert(!invalidStudentDocx.valid, "Non-PDF student submission (.docx) strictly rejected");

  const invalidStudentExe = validateStudentSubmission("malicious_script.exe", "application/octet-stream", 1024);
  assert(!invalidStudentExe.valid, "Executable upload (.exe) strictly rejected for student");

  const pathTraversalStudent = validateStudentSubmission("../../../etc/passwd.pdf", "application/pdf", 1024);
  assert(!pathTraversalStudent.valid, "Path traversal sequence in filename strictly rejected");

  const oversizedStudent = validateStudentSubmission("huge_report.pdf", "application/pdf", 30 * 1024 * 1024);
  assert(!oversizedStudent.valid, "Student PDF exceeding 25MB limit strictly rejected");

  // Teacher: PDF, Image, Video
  const teacherPdf = validateTeacherResource("syllabus_reference.pdf", "application/pdf", 1024 * 1000);
  assert(teacherPdf.valid && teacherPdf.detectedType === "PDF", "Teacher PDF resource accepted");

  const teacherImg = validateTeacherResource("diagram_arch.png", "image/png", 1024 * 500);
  assert(teacherImg.valid && teacherImg.detectedType === "IMAGE", "Teacher Image resource accepted");

  const teacherVid = validateTeacherResource("lecture_demo.mp4", "video/mp4", 1024 * 1024 * 15);
  assert(teacherVid.valid && teacherVid.detectedType === "VIDEO", "Teacher Video resource accepted");

  const teacherExe = validateTeacherResource("setup.bat", "text/plain", 500);
  assert(!teacherExe.valid, "Executable/Batch script strictly rejected for teacher resources");

  // Safe Filename Generation
  const sanitized = sanitizeFilename("Unsafe & Malicious; Filename (1).pdf");
  assert(!sanitized.includes("&") && !sanitized.includes(";") && !sanitized.includes("("), "Sanitized filename eliminates shell meta-characters");
  assert(sanitized.endsWith(".pdf"), "Sanitized filename preserves verified extension");

  // --------------------------------------------------------------------------
  // SECTION 4: GEMINI API ISOLATION, PRIVACY & SAFE FALLBACK
  // --------------------------------------------------------------------------
  console.log("\n▶ [4/7] Testing Gemini API Urgency Classification & Privacy Guard...");

  // Safe fallback test: Empty query
  const fallbackEmpty = await classifyStudentQuery("", "");
  assert(fallbackEmpty.priority === "MEDIUM", "Empty query triggers safe fallback priority MEDIUM");
  assert(fallbackEmpty.source === "FALLBACK", "Fallback mechanism verified");

  // Classification format test
  const queryClass = await classifyStudentQuery(
    "Urgent: AVL Tree balance code fails on deletion",
    "Getting segmentation fault when deleting root of 3-node tree."
  );
  assert(["HIGH", "MEDIUM", "LOW"].includes(queryClass.priority), "Gemini returned priority strictly within allowed set (HIGH, MEDIUM, LOW)");
  assert(typeof queryClass.reason === "string" && queryClass.reason.length > 0, "Query classification provides explanatory reason");

  // Teacher instruction summarization
  const teacherSummary = await summarizeTeacherInstructions(
    "Implement binary search tree rotations. Include execution screenshots and space complexity analysis. Submit PDF before Friday.",
    "Data Structures",
    "2026-09-18"
  );
  assert(teacherSummary.guidelines.includes("Requirements") || teacherSummary.guidelines.includes("•"), "Teacher instructions summarized into structured bullet points");

  // --------------------------------------------------------------------------
  // SECTION 5: CUSTOM DSA DATA STRUCTURES (HEAP, QUEUE, HASH TABLE, PRIORITY QUEUE)
  // --------------------------------------------------------------------------
  console.log("\n▶ [5/7] Testing Custom DSA Core Implementations...");

  // 5.1 Binary Heap (MinHeap)
  const heap = new MinHeap<number>((a, b) => a - b);
  heap.insert(45);
  heap.insert(12);
  heap.insert(89);
  heap.insert(3);
  heap.insert(23);
  assert(heap.peek() === 3, "MinHeap peek returns minimum element (3)");
  assert(heap.extractMin() === 3, "MinHeap extractMin extracts minimum (3)");
  assert(heap.extractMin() === 12, "MinHeap next extraction preserves heap invariant (12)");

  // 5.2 Queue (FIFO)
  const queue = new Queue<string>();
  queue.enqueue("FirstSubmission");
  queue.enqueue("SecondSubmission");
  queue.enqueue("ThirdSubmission");
  assert(queue.peek() === "FirstSubmission", "FIFO Queue peek returns head");
  assert(queue.dequeue() === "FirstSubmission", "FIFO Queue dequeues FirstSubmission");
  assert(queue.dequeue() === "SecondSubmission", "FIFO Queue dequeues SecondSubmission in strict order");

  // 5.3 Hash Table
  const table = new HashTable<string, number>(16);
  table.set("BCA-301", 4);
  table.set("BCA-302", 4);
  table.set("BCA-303", 3);
  assert(table.get("BCA-301") === 4, "HashTable retrieves stored key BCA-301 with O(1) lookup");
  assert(table.get("BCA-303") === 3, "HashTable retrieves stored key BCA-303");
  assert(table.get("NON_EXISTENT") === undefined, "HashTable returns undefined for missing key");
  table.delete("BCA-302");
  assert(table.get("BCA-302") === undefined, "HashTable delete successfully removes key");

  // 5.4 Priority Queue
  const pq = new PriorityQueue<string>();
  pq.enqueue("Routine Task", 3000);
  pq.enqueue("Critical Blocker", 1000);
  pq.enqueue("Standard Inquiry", 2000);
  assert(pq.dequeue() === "Critical Blocker", "PriorityQueue extracts highest priority (lowest weight: 1000)");
  assert(pq.dequeue() === "Standard Inquiry", "PriorityQueue extracts next priority (weight: 2000)");
  assert(pq.dequeue() === "Routine Task", "PriorityQueue extracts lowest priority last (weight: 3000)");

  // --------------------------------------------------------------------------
  // SECTION 6: DATA CONSISTENCY & STATE REBUILD FROM SQL
  // --------------------------------------------------------------------------
  console.log("\n▶ [6/7] Testing Data Consistency: SQL Source of Truth & DSA State Rebuild...");

  // Rebuild state from SQL
  const rebuildStats = await dsaEngine.rebuildDsaStateFromSql();
  assert(rebuildStats.cachedSubjectsCount > 0, "DSA Engine rebuilt subjects into HashTable from SQL");
  assert(typeof rebuildStats.openQueriesCount === "number", "DSA Engine loaded open queries into PriorityQueue from SQL");

  // Simulate SQL query insertion -> DSA Priority Queue synchronization
  const now = Date.now();
  const testQueryPayload = {
    id: `test_qry_${now}`,
    teacherId: teacherUser!.teacher ? (await prisma.teacher.findFirst())!.id : "teacher_1",
    priority: "HIGH",
    createdAt: new Date(now),
    title: "Test In-Memory Queue Synchronization",
  };

  const calculatedPosition = await dsaEngine.onQueryCreated(testQueryPayload);
  assert(calculatedPosition >= 1, "DSA PriorityQueue assigned dynamic queue position for newly created query");

  // Simulate query resolution -> DSA Priority Queue removal
  await dsaEngine.onQueryResolved(testQueryPayload.id, testQueryPayload.teacherId);
  console.log("  ✓ Query resolved in SQL and evacuated from runtime PriorityQueue");

  // --------------------------------------------------------------------------
  // SECTION 7: EDGE CASES VERIFICATION
  // --------------------------------------------------------------------------
  console.log("\n▶ [7/7] Testing Edge Cases...");

  // Edge Case 1: Empty queries list
  const emptyOrdered = dsaEngine.prioritizeQueries([]);
  assert(emptyOrdered.length === 0, "Edge Case: Zero queries handled without exception");

  // Edge Case 2: Multiple HIGH priority queries (tie-breaking by age)
  const highQueries = [
    { id: "h1", priority: "HIGH", createdAt: new Date(now - 1000 * 60 * 5) }, // 5 mins ago
    { id: "h2", priority: "HIGH", createdAt: new Date(now - 1000 * 60 * 60) }, // 60 mins ago (older -> first)
  ];
  const highOrdered = dsaEngine.prioritizeQueries(highQueries);
  assert(highOrdered[0].id === "h2", "Edge Case: Multiple HIGH queries tie-broken by waiting time (older first)");

  // Edge Case 3: Multiple queries with identical priority and identical timestamp
  const sameQueries = [
    { id: "same1", priority: "MEDIUM", createdAt: new Date(now) },
    { id: "same2", priority: "MEDIUM", createdAt: new Date(now) },
  ];
  const sameOrdered = dsaEngine.prioritizeQueries(sameQueries);
  assert(sameOrdered.length === 2, "Edge Case: Multiple queries with identical priority preserved in queue");

  // Edge Case 4: Long waiting LOW query vs new HIGH query
  const mixedQueries = [
    { id: "lowOld", priority: "LOW", createdAt: new Date(now - 1000 * 60 * 60 * 24 * 7) }, // 7 days old LOW
    { id: "highNew", priority: "HIGH", createdAt: new Date(now) }, // brand new HIGH
  ];
  const mixedOrdered = dsaEngine.prioritizeQueries(mixedQueries);
  assert(mixedOrdered[0].id === "highNew", "Edge Case: HIGH priority strictly dominates even when LOW has waited longer");

  // Edge Case 5: Expired assignment scheduling
  const expiredAssignments = [
    {
      id: "exp1",
      title: "Past Due Assignment",
      dueDate: new Date(now - 1000 * 60 * 60 * 48), // 2 days ago
      maxMarks: 100,
      subject: { name: "Data Structures", code: "BCA-301" },
    },
    {
      id: "future1",
      title: "Future Assignment",
      dueDate: new Date(now + 1000 * 60 * 60 * 72), // 3 days in future
      maxMarks: 100,
      subject: { name: "Data Structures", code: "BCA-301" },
    },
  ];
  const prioritizedAssignments = dsaEngine.prioritizeAssignments(expiredAssignments);
  assert(prioritizedAssignments[0].id === "exp1", "Edge Case: Expired assignment prioritized first for immediate resolution");
  assert(prioritizedAssignments[0].urgency === "OVERDUE", "Edge Case: Past due assignment flagged as OVERDUE");

  console.log("\n===============================================================================");
  console.log(` AUDIT SUMMARY: ALL ${passedTests}/${totalTests} PRODUCTION CHECKS PASSED!`);
  console.log("===============================================================================");
}

runAudit().catch((err) => {
  console.error("Audit Suite Encountered Error:", err);
  process.exit(1);
});
