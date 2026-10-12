"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  Clock,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface StudentDashboardData {
  student: {
    id: string;
    customId: string;
    name: string;
    email: string;
    rollNumber: string;
    semester: number;
    section: {
      name: string;
      program: string;
    };
  };
  prioritizedAssignments: Array<{
    id: string;
    title: string;
    description: string;
    subjectName: string;
    subjectCode: string;
    dueDate: string;
    daysRemaining: number;
    maxMarks: number;
    teacherName: string;
    isSubmitted: boolean;
    submissionMethod?: string;
  }>;
  metrics: {
    totalSubjects: number;
    activeAssignments: number;
    pendingAssignments: number;
    submittedAssignments: number;
  };
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/student/dashboard");
        if (!res.ok) throw new Error("Could not load dashboard data.");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load academic records.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading Dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-900 text-sm">Failed to Load Dashboard</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  const { student, prioritizedAssignments, metrics } = data;
  const pendingTasks = prioritizedAssignments.filter((a) => !a.isSubmitted);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Student Information Header (Clean & Minimal) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
            {student.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Student ID: {student.customId || "AT-STUDENT-001"}</span>
            <span>•</span>
            <span className="font-medium text-slate-700">Cohort: {student.section.name.replace(" - SEC-", " / ").replace(" - ", " / ")}</span>
            <span>•</span>
            <span className="font-medium text-slate-700">Semester {student.semester}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <Link
            href="/student/queries"
            className="px-3.5 py-1.5 text-xs font-semibold text-[#15193B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Ask Teacher
          </Link>
          <Link
            href="/student/assignments"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#15193B] hover:bg-[#1e2352] rounded-xl transition-colors shadow-xs"
          >
            View Assignments
          </Link>
        </div>
      </div>

      {/* 2. Four Core Summary Information Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Subjects */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Subjects</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-[#0F172A]">
            {metrics.totalSubjects}
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Tasks</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-[#0F172A]">
            {metrics.activeAssignments}
          </div>
        </div>

        {/* Pending Work */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending Work</span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-[#D97706]">
            {metrics.pendingAssignments}
          </div>
        </div>

        {/* Submitted Work */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Submitted Work</span>
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-emerald-600">
            {metrics.submittedAssignments}
          </div>
        </div>
      </div>

      {/* 3. Upcoming Deadlines Section (Non-repetitive, actionable) */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-heading font-bold text-[#0F172A]">
            Upcoming Tasks
          </h2>
          <Link
            href="/student/assignments"
            className="text-xs font-semibold text-[#15193B] hover:text-indigo-600 flex items-center space-x-1"
          >
            <span>All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 text-xs shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span className="font-bold text-slate-800 text-sm">All work submitted</span>
            <p className="mt-1">You have completed all currently active coursework tasks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingTasks.map((task) => {
              const isUrgent = task.daysRemaining <= 2;

              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {task.subjectCode}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : task.daysRemaining <= 5
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {task.daysRemaining === 0
                          ? "Due Today"
                          : task.daysRemaining === 1
                          ? "Due Tomorrow"
                          : `${task.daysRemaining} days left`}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-heading font-bold text-[#0F172A] line-clamp-1">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Course:</span>
                        <span className="font-medium text-slate-700">{task.subjectName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Faculty:</span>
                        <span className="font-medium text-slate-700">{task.teacherName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Due Date:</span>
                        <span className="font-medium text-slate-800">
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/student/assignments/${task.id}`}
                    className="w-full flex items-center justify-center space-x-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>View Task</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
