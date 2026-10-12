"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UploadCloud,
  Building2,
  Award,
} from "lucide-react";

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  submissionMethod: "ONLINE" | "PHYSICAL";
  teacherLocation: string;
  assignedDate: string;
  dueDate: string;
  maxMarks: number;
  daysRemaining: number;
  isOverdue: boolean;
  subject: {
    id: string;
    code: string;
    name: string;
    isLab: boolean;
  };
  teacher: {
    name: string;
    email: string;
    cabinLocation: string;
  };
  resourcesCount: number;
  status: "Not Started" | "In Progress" | "Submitted" | "Verified" | "Correction Required" | "Overdue";
  submission: {
    id: string;
    fileName: string;
    submittedAt: string;
    marksAwarded?: number;
    feedback?: string;
  } | null;
}

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await fetch("/api/student/assignments");
        if (!res.ok) throw new Error("Could not load assignments.");
        const data = await res.json();
        setAssignments(data.assignments || []);
      } catch (err: any) {
        setError(err.message || "Failed to load assignments.");
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading Assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-900 text-sm">Failed to Load Assignments</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  const filtered = assignments.filter((a) => {
    const matchesFilter =
      activeFilter === "ALL"
        ? true
        : activeFilter === "PENDING"
        ? a.status === "Not Started" || a.status === "In Progress"
        : activeFilter === "SUBMITTED"
        ? a.status === "Submitted"
        : activeFilter === "VERIFIED"
        ? a.status === "Verified"
        : activeFilter === "OVERDUE"
        ? a.status === "Overdue"
        : true;

    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.teacher.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = subjectId ? a.subject.id === subjectId : true;

    return matchesFilter && matchesSearch && matchesSubject;
  });

  const subjectFilterName = subjectId && assignments.length > 0
    ? assignments.find(a => a.subject.id === subjectId)?.subject.name
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Simple, Clean Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
            {subjectFilterName ? `${subjectFilterName} Tasks` : "Assignments"}
          </h1>
          {subjectFilterName && (
            <Link href="/student/assignments" className="text-xs text-indigo-600 font-semibold hover:underline">
              Clear Subject Filter
            </Link>
          )}
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {filtered.length} {subjectFilterName ? "Tasks" : "Total"}
        </span>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-medium">
          {[
            { id: "ALL", label: "All" },
            { id: "PENDING", label: "Pending" },
            { id: "SUBMITTED", label: "Submitted" },
            { id: "VERIFIED", label: "Graded" },
            { id: "OVERDUE", label: "Overdue" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-white text-[#0F172A] font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#15193B] text-slate-900"
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="font-semibold text-slate-700 text-sm">No assignments found</span>
            <p className="mt-1">No tasks match the active filter or search query.</p>
          </div>
        ) : (
          filtered.map((a) => {
            return (
              <div
                key={a.id}
                className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Header Row: Subject, Method, Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-[#0F172A]">
                        {a.subject.code}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {a.subject.name}
                      </span>
                      <span>•</span>

                      {/* Method Badge */}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 bg-blue-50 text-blue-800 border border-blue-200"
                      >
                        <UploadCloud className="w-3 h-3 text-blue-600" />
                        <span>Online</span>
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          a.status === "Verified"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : a.status === "Submitted"
                            ? "bg-blue-100 text-blue-800"
                            : a.status === "Overdue"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : a.status === "Correction Required"
                            ? "bg-orange-50 text-orange-800 border border-orange-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {a.status === "Verified" ? "Graded" : a.status}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h2 className="text-base font-heading font-bold text-[#0F172A]">
                        {a.title}
                      </h2>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {a.description}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                      <span>Faculty: <strong className="text-slate-700">{a.teacher.name}</strong></span>
                      {a.resourcesCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{a.resourcesCount} Resources</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Deadlines, Marks & Action Button */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 md:pl-4 min-w-[150px]">
                    <div className="text-right space-y-0.5 text-xs">
                      <div className="font-semibold text-slate-800">
                        Due: {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>

                    <Link
                      href={`/student/assignments/${a.id}`}
                      className="px-3.5 py-1.5 bg-[#15193B] hover:bg-[#1e2352] text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 shadow-xs"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#F59E0B]" />
                    </Link>
                  </div>
                </div>

                {/* Feedback Note if Graded / Evaluated */}
                {a.submission && a.submission.feedback && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs flex items-start space-x-2 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Feedback</span>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Remark: "{a.submission.feedback}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function StudentAssignmentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading Assignments...</p>
      </div>
    }>
      <AssignmentsContent />
    </Suspense>
  );
}
