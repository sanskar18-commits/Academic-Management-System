# 🎓 Academic Management System (AcadmicTrack)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75B2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![C++](https://img.shields.io/badge/C++-DSA_Engine-00599C?style=for-the-badge&logo=c%2B%2B)](https://isocpp.org/)

An enterprise-grade, Project-Based Learning (**PBL**) academic management platform designed to streamline coursework, assignment lifecycles, student doubt resolutions, and institutional grading. Powered by **Next.js 14 App Router**, **Prisma ORM**, a custom in-memory **DSA Engine (with dual TypeScript and C++ implementations)**, and privacy-preserving **Google Gemini AI**.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
  - [👨‍🎓 Student Portal](#-student-portal)
  - [👩‍🏫 Teacher Portal](#-teacher-portal)
  - [⚡ In-Memory DSA Core Engine](#-in-memory-dsa-core-engine)
  - [🤖 Gemini AI Pedagogical Integration](#-gemini-ai-pedagogical-integration)
  - [🛡️ Enterprise Security & Validation](#️-enterprise-security--validation)
- [System Architecture](#-system-architecture)
- [Data Structures & Algorithms (DSA) Engine](#-data-structures--algorithms-dsa-engine)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup & Seeding](#database-setup--seeding)
  - [Running Development Server](#running-development-server)
  - [Running the Test & Audit Suite](#running-the-test--audit-suite)
- [Pre-configured Demo Accounts](#-pre-configured-demo-accounts)
- [Contributing & License](#-contributing--license)

---

## 🌟 Key Features

### 👨‍🎓 Student Portal
- **Dashboard Overview:** Real-time visibility into active subjects, pending deadlines, submitted assignments, and resolved queries.
- **Assignment Submissions:** Secure PDF-only submission portal with strict file validation, status tracking (`SUBMITTED`, `VERIFIED`, `CORRECTION_REQUIRED`), and teacher feedback viewing.
- **Urgent Academic Queries:** Interactive query creation with automated urgency estimation and real-time status tracking in the faculty queue.
- **Subject Directory:** View enrolled courses, syllabus details, faculty contacts, and cabin locations.
- **Notification Feed:** Real-time notices for new assignments, approaching deadlines, and teacher answers.

### 👩‍🏫 Teacher Portal
- **Assignment Management:** Create, publish, update, and manage course assignments with deadlines, maximum marks, guidelines, and reference attachments (PDF, Images, Video).
- **Submissions & Grading:** Review submitted student coursework, enter marks, return feedback, or request corrections.
- **Prioritized Doubt Queue:** View incoming student inquiries ranked automatically by priority and waiting time via the custom DSA Priority Queue.
- **AI-Powered Guideline Assistant:** Turn raw teaching outlines or lecture dictation notes into clean, bulleted assignment guidelines with one click.
- **Section & Subject Overview:** Class roster access mapped strictly by institutional sections (e.g., `BCA - SEC-G3`).

### ⚡ In-Memory DSA Core Engine
- High-performance custom algorithmic layer implemented without external third-party collections.
- Features dual-mode execution: **Pure TypeScript** engine for portability and a native compiled **C++ Engine (`dsa_engine.exe`)** with Node.js bridge.
- Rebuilds and synchronizes state dynamically with the SQL database on system boot.

### 🤖 Gemini AI Pedagogical Integration
- **Strict Privacy Guarantee:** No credentials, user IDs, student identifiers, or database keys are ever passed to the external API. Only minimal cleaned text is transmitted.
- **Urgency Classification:** Classifies incoming academic queries into `HIGH`, `MEDIUM`, or `LOW` urgency.
- **Zero-Crash Resilience:** Features automated heuristic fallbacks—if the API key is missing or requests time out, the system automatically falls back without disruption.

### 🛡️ Enterprise Security & Validation
- **Secure Authentication:** `bcryptjs` password hashing with salt rounds and cryptographically signed JWT cookies (`httpOnly`, `SameSite`).
- **Strict Role-Based Access Control (RBAC):** Middleware and route-level guards isolating Student, Teacher, and Administrator privileges.
- **Defense-in-Depth File Uploads:**
  - MIME-type sniffing and file signature inspection.
  - Path traversal and shell meta-character sanitization (`../../../` filtering).
  - Maximum size limits (25MB for submissions, 50MB for teacher attachments).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Client["Client (Browser / React 18 / Tailwind)"]
    Auth["JWT Authentication & RBAC Guard"]
    API["Next.js 14 App Router API Layer"]
    DB[(SQLite Database via Prisma ORM)]
    DSA["In-Memory DSA Engine (MinHeap, PriorityQueue, HashTable)"]
    CPP["Native C++ DSA Bridge (Optional High-Perf)"]
    Gemini["Google Gemini 1.5 Flash (Privacy-Preserved)"]

    Client -->|HTTPS Requests| Auth
    Auth --> API
    API <-->|Read / Write| DB
    API <-->|Queue Ordering & O(1) Cache| DSA
    DSA <-->|JSON IPC| CPP
    API -.->|Query Urgency & Guideline Synthesis| Gemini
```

---

## 🧠 Data Structures & Algorithms (DSA) Engine

| Data Structure | Implementation | Real-World Application in AcadmicTrack | Time Complexity |
| :--- | :--- | :--- | :--- |
| **Priority Queue (Min-Heap)** | `server/dsa/PriorityQueue.ts` & `server/dsa/cpp/PriorityQueue.hpp` | Prioritizing teacher's student query queue by urgency weight + arrival timestamp | Enqueue: $O(\log n)$<br>Dequeue: $O(\log n)$ |
| **Binary Min-Heap** | `server/dsa/MinHeap.ts` & `server/dsa/cpp/MinHeap.hpp` | Scheduling assignment urgency and tracking earliest approaching deadlines | Push: $O(\log n)$<br>ExtractMin: $O(\log n)$ |
| **Hash Table** | `server/dsa/HashTable.ts` & `server/dsa/cpp/HashTable.hpp` | High-speed cache for subject codes, section rosters, and session tokens | Get/Set: $O(1)$ amortized |
| **FIFO Queue** | `server/dsa/Queue.ts` & `server/dsa/cpp/Queue.hpp` | Sequential assignment submission verification buffer for grading audits | Enqueue: $O(1)$<br>Dequeue: $O(1)$ |

---

## 💻 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server-Side API Handlers)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict type-checking) & [C++17](https://isocpp.org/)
- **UI / Styling:** [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **ORM & Database:** [Prisma ORM](https://www.prisma.io/) with [SQLite](https://sqlite.org/)
- **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Generative AI:** [Google Gemini 1.5 Flash API](https://ai.google.dev/) via fetch stream

---

## 📁 Project Directory Structure

```plaintext
AcadmicTrack/
├── app/                              # Next.js 14 App Router
│   ├── api/                          # Backend REST Endpoints
│   │   ├── auth/                     # Login, Logout, Change Password, Me
│   │   ├── dsa/                      # DSA Engine diagnostic & sync status
│   │   ├── student/                  # Assignments, Submissions, Queries, Profile
│   │   └── teacher/                  # Assignment authoring, Grading, Guidelines
│   ├── login/                        # Unified authentication view
│   ├── student/                      # Student portal views (Dashboard, Tasks, Queries)
│   ├── teacher/                      # Teacher portal views (Grading, Guidelines, Queue)
│   ├── globals.css                   # Global styles & Tailwind utilities
│   └── layout.tsx                    # Root layout & theme wrapper
├── components/                       # Shared UI components (Sidebar, Header, Alerts)
├── lib/                              # Core Utilities
│   ├── auth.ts                       # JWT verification & password hashing
│   ├── fileSecurity.ts               # MIME verification & path traversal prevention
│   ├── gemini.ts                     # Google Gemini AI client & fallback logic
│   └── prisma.ts                     # Prisma client singleton
├── prisma/
│   ├── schema.prisma                 # Relational schema (Users, Subjects, Submissions)
│   └── seed.ts                       # Database seeding script with realistic data
├── scripts/
│   └── test-production-audit.ts      # Automated end-to-end audit test suite
├── server/dsa/                       # Custom Data Structures & Algorithms Core
│   ├── cpp/                          # C++ Native implementations & bridge
│   │   ├── HashTable.hpp
│   │   ├── MinHeap.hpp
│   │   ├── PriorityQueue.hpp
│   │   ├── Queue.hpp
│   │   └── main.cpp
│   ├── cppBridge.ts                  # Subprocess IPC bridge to C++ binary
│   ├── dsaService.ts                 # Unified DSA orchestrator & SQL sync
│   ├── HashTable.ts                  # Pure TypeScript Hash Table
│   ├── MinHeap.ts                    # Pure TypeScript Min Heap
│   ├── PriorityQueue.ts              # Pure TypeScript Priority Queue
│   ├── Queue.ts                      # Pure TypeScript FIFO Queue
│   └── test.ts                       # Unit tests for TypeScript DSA algorithms
├── .env.example                      # Environment variable template
├── package.json                      # Project dependencies & npm scripts
├── tailwind.config.ts                # Tailwind design configuration
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm** or **pnpm**
- *(Optional)* **g++ / Clang** with C++17 support if compiling the native C++ DSA engine

### Environment Configuration
Copy the template `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
# Optional: Enables AI Urgency Classification and Guideline Generation
GEMINI_API_KEY="your-google-gemini-api-key"
```

### Database Setup & Seeding
Generate the Prisma Client, push the schema to SQLite, and seed test accounts:

```bash
# Push database schema
npm run db:push

# Seed with standard students, teachers, subjects, and sample assignments
npm run db:seed
```

### Running Development Server
Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Running the Test & Audit Suite

Run unit tests for custom Data Structures:
```bash
npm run test:dsa
```

Run full production security, role isolation, and consistency audit:
```bash
npx tsx scripts/test-production-audit.ts
```

---

## 🔑 Pre-configured Demo Accounts

After running `npm run db:seed`, the following accounts are available for testing:

| Role | Email | Password | Identifier / Cohort |
| :--- | :--- | :--- | :--- |
| **Student** | `aarav.sharma@geu.ac.in` | `Student@123` | `GEU/2023/BCA/042` (BCA Sec G3) |
| **Teacher** | `dr.vikram.sharma@geu.ac.in` | `Teacher@123` | `EMP-GEU-1082` (Associate Professor) |

---

## 📄 Contributing & License

This project was built for educational and research demonstration as part of an institutional academic management curriculum.

Distributed under the **MIT License**. Feel free to fork, customize, and extend!
