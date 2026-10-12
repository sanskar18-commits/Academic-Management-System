import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Academic Track database for full Student Portal...");

  // Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.queryResponse.deleteMany();
  await prisma.query.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignmentResource.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.sectionSubject.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.section.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared old database entries.");

  // 1. Create Section: BCA - SEC-G3
  const sectionG3 = await prisma.section.create({
    data: {
      name: "BCA - SEC-G3",
      program: "Bachelor of Computer Applications",
      batch: "2023-2026",
      semester: 3,
    },
  });
  console.log(`Created Section: ${sectionG3.name}`);

  // 2. Create the 8 mandatory subjects for BCA - SEC-G3
  const subjectData = [
    {
      code: "BCA-301",
      name: "Introduction to Data Structures",
      credits: 4,
      isLab: false,
    },
    {
      code: "BCA-302",
      name: "Introduction to Database Management System",
      credits: 4,
      isLab: false,
    },
    {
      code: "BCA-303",
      name: "Digital Logic Design",
      credits: 3,
      isLab: false,
    },
    {
      code: "BCA-304",
      name: "Fundamentals of Cloud Computing",
      credits: 3,
      isLab: false,
    },
    {
      code: "BCA-305E",
      name: "Elective (Cloud & Web Technologies)",
      credits: 3,
      isLab: false,
    },
    {
      code: "BCA-305",
      name: "Skills for Career Success 1",
      credits: 2,
      isLab: false,
    },
    {
      code: "BCA-306P",
      name: "Introduction to Data Structures Laboratory",
      credits: 2,
      isLab: true,
    },
    {
      code: "BCA-307P",
      name: "Database Management System Laboratory",
      credits: 2,
      isLab: true,
    },
  ];

  const createdSubjects: Record<string, any> = {};
  for (const s of subjectData) {
    const created = await prisma.subject.create({
      data: s,
    });
    createdSubjects[s.code] = created;

    // Relate Section -> Subject
    await prisma.sectionSubject.create({
      data: {
        sectionId: sectionG3.id,
        subjectId: created.id,
      },
    });
  }
  console.log(`Created and linked all 8 subjects to Section G3.`);

  // 3. Create Demo Users
  const studentPassword = process.env.DEMO_STUDENT_PASSWORD || "Student@123";
  const teacherPassword = process.env.DEMO_TEACHER_PASSWORD || "Teacher@123";

  const studentPasswordHash = await bcrypt.hash(studentPassword, 10);
  const teacherPasswordHash = await bcrypt.hash(teacherPassword, 10);

  // Student: AT-STUDENT-001 (Aarav Sharma)
  const studentUser = await prisma.user.create({
    data: {
      customId: "AT-STUDENT-001",
      email: "student.g3@academictrack.edu",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      name: "Aarav Sharma",
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      rollNumber: "2105794",
      sectionId: sectionG3.id,
      semester: 3,
      admissionYear: 2023,
    },
  });
  console.log(`Created Student: ${studentUser.customId} - ${studentUser.name}`);

  // Primary Faculty: Dr. Rajeshwar Verma
  const teacherUser1 = await prisma.user.create({
    data: {
      customId: "AT-TEACHER-001",
      email: "faculty.cs@academictrack.edu",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
      name: "Dr. Rajeshwar Verma",
    },
  });

  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacherUser1.id,
      employeeId: "EMP-1082",
      department: "Department of Computer Applications",
      designation: "Associate Professor & Head of Division",
      cabinLocation: "Faculty Cabin 204, CS Block B",
    },
  });

  // Secondary Faculty: Prof. Vikram Joshi (DLD & Labs)
  const teacherUser2 = await prisma.user.create({
    data: {
      customId: "AT-TEACHER-002",
      email: "vikram.joshi@academictrack.edu",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
      name: "Prof. Vikram Joshi",
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacherUser2.id,
      employeeId: "EMP-1095",
      department: "Department of Computer Applications",
      designation: "Assistant Professor (Senior Grade)",
      cabinLocation: "Room 105, Hardware Engineering Wing",
    },
  });

  // Secondary Faculty: Dr. Anita Rawat (Cloud & Electives)
  const teacherUser3 = await prisma.user.create({
    data: {
      customId: "AT-TEACHER-003",
      email: "anita.rawat@academictrack.edu",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
      name: "Dr. Anita Rawat",
    },
  });

  const teacher3 = await prisma.teacher.create({
    data: {
      userId: teacherUser3.id,
      employeeId: "EMP-1120",
      department: "Department of Computer Applications",
      designation: "Associate Professor",
      cabinLocation: "Room 312, Faculty Wing, CS Block",
    },
  });

  // 4. Allocate Teachers to Subjects for Section G3
  const teacherAllocations = [
    { code: "BCA-301", teacher: teacher1 },
    { code: "BCA-302", teacher: teacher1 },
    { code: "BCA-306P", teacher: teacher1 },
    { code: "BCA-307P", teacher: teacher1 },
    { code: "BCA-303", teacher: teacher2 },
    { code: "BCA-304", teacher: teacher3 },
    { code: "BCA-305E", teacher: teacher3 },
    { code: "BCA-305", teacher: teacher2 },
  ];

  for (const alloc of teacherAllocations) {
    await prisma.teacherSubject.create({
      data: {
        teacherId: alloc.teacher.id,
        subjectId: createdSubjects[alloc.code].id,
        sectionId: sectionG3.id,
        academicYear: "2024-2025",
        semester: 3,
      },
    });
  }

  // 5. Create Rich Assignments with Online & Physical submission modes
  const now = new Date();

  // Assignment 1: Online Submission (Critical - 2 days remaining)
  const due1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const assign1 = await prisma.assignment.create({
    data: {
      title: "Implementation of Binary Search Tree & AVL Balancing",
      description: "Implement a fully balanced AVL tree with node height recalculation, balance factor tracking, and all 4 rotation cases (LL, RR, LR, RL). Write unit tests for duplicate insertions and deletion.",
      instructions: "Submit a single PDF document containing your documented C++/Java source code, test execution output screenshots, and time complexity analysis for insertions.",
      submissionMethod: "ONLINE",
      teacherLocation: teacher1.cabinLocation,
      subjectId: createdSubjects["BCA-301"].id,
      teacherId: teacher1.id,
      sectionId: sectionG3.id,
      assignedDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      dueDate: due1,
      maxMarks: 50,
      status: "ACTIVE",
      resources: {
        create: [
          {
            fileName: "AVL_Tree_Formal_Specification.pdf",
            fileUrl: "/docs/avl_spec.pdf",
            fileType: "application/pdf",
            resourceType: "PDF",
            fileSize: "1.4 MB",
          },
          {
            fileName: "AVL_Rotation_Reference_Diagram.png",
            fileUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
            fileType: "image/png",
            resourceType: "IMAGE",
            fileSize: "420 KB",
          },
          {
            fileName: "Video_Lecture_AVL_Rebalancing_Walkthrough",
            fileUrl: "https://www.youtube.com/watch?v=vRwi_UCVr20",
            fileType: "video/mp4",
            resourceType: "VIDEO",
            fileSize: "Streaming HD",
          },
        ],
      },
    },
  });

  // Assignment 2: Online Submission (Submitted by Aarav)
  const due2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const assign2 = await prisma.assignment.create({
    data: {
      title: "Relational Schema Normalization & BCNF Decomposition",
      description: "Analyze the student clinic database schema. Identify candidate keys, calculate closures of functional dependencies, and decompose the schema into 3NF and BCNF.",
      instructions: "Submit your comprehensive normalization proof and dependency preservation matrix as a PDF.",
      submissionMethod: "ONLINE",
      teacherLocation: teacher1.cabinLocation,
      subjectId: createdSubjects["BCA-302"].id,
      teacherId: teacher1.id,
      sectionId: sectionG3.id,
      assignedDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      dueDate: due2,
      maxMarks: 40,
      status: "ACTIVE",
      resources: {
        create: [
          {
            fileName: "Clinic_Management_Schema_Draft.pdf",
            fileUrl: "/docs/clinic_schema.pdf",
            fileType: "application/pdf",
            resourceType: "PDF",
            fileSize: "850 KB",
          },
        ],
      },
    },
  });

  // Submission for Assignment 2 by Aarav Sharma
  await prisma.submission.create({
    data: {
      assignmentId: assign2.id,
      studentId: student.id,
      submissionText: "Submitted full step-by-step mathematical decomposition to BCNF, including lossless join proof and functional dependency preservation tests.",
      fileName: "GEU_042_Aarav_BCNF_Decomposition.pdf",
      fileUrl: "/uploads/submissions/aarav_bcnf.pdf",
      submittedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      status: "SUBMITTED",
    },
  });

  // Assignment 3: PHYSICAL Submission
  const due3 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await prisma.assignment.create({
    data: {
      title: "Hardware Blueprint: Synchronous 4-Bit Up/Down Counter",
      description: "Design a synchronous 4-bit binary up/down counter using JK Flip-Flops and logic gates. Draw excitation tables, Karnaugh maps for each flip-flop input, and state transition graphs.",
      instructions: "PHYSICAL SUBMISSION MANDATORY: Draw schematic diagrams neatly on standard A3/A4 engineering sheets with your Roll Number stamped on top right. Submit directly to Prof. Vikram Joshi in the Hardware Engineering Lab.",
      submissionMethod: "PHYSICAL",
      teacherLocation: "Electronics & DLD Lab 102, Academic Block 3",
      subjectId: createdSubjects["BCA-303"].id,
      teacherId: teacher2.id,
      sectionId: sectionG3.id,
      assignedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      dueDate: due3,
      maxMarks: 30,
      status: "ACTIVE",
      resources: {
        create: [
          {
            fileName: "JK_FlipFlop_Excitation_Reference.pdf",
            fileUrl: "/docs/jk_excitation.pdf",
            fileType: "application/pdf",
            resourceType: "PDF",
            fileSize: "620 KB",
          },
          {
            fileName: "Counter_Timing_Diagram_Sample.png",
            fileUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
            fileType: "image/png",
            resourceType: "IMAGE",
            fileSize: "310 KB",
          },
        ],
      },
    },
  });

  // Assignment 4: Verified / Graded Lab Task
  const due4 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // Past deadline
  const assign4 = await prisma.assignment.create({
    data: {
      title: "Lab Practical 04: Circular Queue & Infix-to-Postfix",
      description: "Develop circular queue implementation with array bounds checking and stack conversion of infix mathematical expressions.",
      instructions: "Submit documented code and test run logs.",
      submissionMethod: "ONLINE",
      teacherLocation: teacher1.cabinLocation,
      subjectId: createdSubjects["BCA-306P"].id,
      teacherId: teacher1.id,
      sectionId: sectionG3.id,
      assignedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      dueDate: due4,
      maxMarks: 25,
      status: "ACTIVE",
    },
  });

  // Verified submission for Assignment 4
  await prisma.submission.create({
    data: {
      assignmentId: assign4.id,
      studentId: student.id,
      submissionText: "Implemented circular queue with modulo arithmetic and shunting-yard algorithm for infix evaluation.",
      fileName: "GEU_042_CircularQueue_Stack.pdf",
      fileUrl: "/uploads/submissions/aarav_queue.pdf",
      submittedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      status: "VERIFIED",
      marksAwarded: 24,
      feedback: "Exceptional code quality and thoroughly documented boundary test cases. Well done Aarav.",
    },
  });

  // Assignment 5: Elective Subject Assignment (Physical)
  const due5 = new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000);
  await prisma.assignment.create({
    data: {
      title: "Microservices Architecture & Docker Deployment Case Study",
      description: "Select an enterprise e-commerce platform and analyze its containerized architecture using Docker and Kubernetes orchestration patterns.",
      instructions: "Submit printed technical dossier with architectural topology charts directly to Dr. Anita Rawat's office.",
      submissionMethod: "PHYSICAL",
      teacherLocation: teacher3.cabinLocation,
      subjectId: createdSubjects["BCA-305E"].id,
      teacherId: teacher3.id,
      sectionId: sectionG3.id,
      assignedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      dueDate: due5,
      maxMarks: 35,
      status: "ACTIVE",
    },
  });

  // 6. Create Academic Queries with 4-Step Status Tracker & Auto Query IDs
  // Query 1: Answered
  const q1 = await prisma.query.create({
    data: {
      queryCode: "QRY-2024-BCA-1042",
      studentId: student.id,
      teacherId: teacher1.id,
      subjectId: createdSubjects["BCA-301"].id,
      assignmentId: assign1.id,
      title: "Clarification on AVL Rotation cases for duplicate keys",
      question: "Respected Sir, for Assignment 1 on AVL balancing, should duplicate key insertions be rejected or handled via frequency counters in the node structure?",
      status: "RESOLVED",
      workflowStep: "ANSWERED",
      priority: "NORMAL",
      aiCategory: "Syntax & Implementation",
      responses: {
        create: [
          {
            userId: teacherUser1.id,
            responseText: "Good query Aarav. Store a 'frequency' integer inside each BST node instead of duplicating tree nodes. This keeps tree height optimal.",
          },
        ],
      },
    },
  });

  // Query 2: Waiting for Teacher
  await prisma.query.create({
    data: {
      queryCode: "QRY-2024-BCA-1048",
      studentId: student.id,
      teacherId: teacher1.id,
      subjectId: createdSubjects["BCA-302"].id,
      assignmentId: assign2.id,
      title: "Lossless Join decomposition verification query",
      question: "In question 3 of the clinic normalization task, does the prescription table retain functional dependency with Doctor_License if decomposed to 3NF?",
      status: "OPEN",
      workflowStep: "WAITING_FOR_TEACHER",
      priority: "URGENT",
      aiCategory: "Theoretical Concept",
    },
  });

  // 7. Create Student Academic Notifications
  const notificationItems = [
    {
      title: "New Assignment Published",
      message: "Prof. Vikram Joshi published 'Hardware Blueprint: Synchronous 4-Bit Up/Down Counter' for BCA-303.",
      type: "NEW_ASSIGNMENT",
      link: "/student/assignments",
      read: false,
    },
    {
      title: "Deadline Approaching (Urgent)",
      message: "BCA-301 'Implementation of Binary Search Tree & AVL Balancing' is due in 48 hours.",
      type: "DEADLINE_APPROACHING",
      link: `/student/assignments/${assign1.id}`,
      read: false,
    },
    {
      title: "Submission Evaluated & Graded",
      message: "Dr. Rajeshwar Verma verified your submission for Lab Practical 04. Score: 24/25.",
      type: "SUBMISSION_VERIFIED",
      link: "/student/submissions",
      read: true,
    },
    {
      title: "Teacher Responded to Query",
      message: "Dr. Rajeshwar Verma answered your inquiry regarding AVL duplicate keys (QRY-2024-BCA-1042).",
      type: "QUERY_ANSWERED",
      link: "/student/queries",
      read: true,
    },
  ];

  for (const n of notificationItems) {
    await prisma.notification.create({
      data: {
        userId: studentUser.id,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        read: n.read,
      },
    });
  }

  console.log("Academic Track database seeded with all 8 subjects, online/physical assignments, queries, and notifications!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
