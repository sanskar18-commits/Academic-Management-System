"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  MapPin,
  Check,
  Edit2,
  X,
  PlusCircle,
  FileCheck2,
  HelpCircle,
} from "lucide-react";

interface TeacherDashboardData {
  teacher: {
    id: string;
    customId: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    cabinLocation: string;
  };
  allocatedSubjects: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    isLab: boolean;
    section: string;
    academicYear: string;
    semester: number;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    subjectCode: string;
    subjectName: string;
    sectionName: string;
    dueDate: string;
    status: string;
    submissionCount: number;
  }>;
  gradingQueue: Array<{
    submissionId: string;
    assignmentTitle: string;
    studentName: string;
    studentRoll: string;
    submittedAt: string;
    section: string;
    queuePosition: number;
  }>;
  queries: Array<{
    id: string;
    queryCode: string;
    title: string;
    question: string;
    status: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    createdAt: string;
    studentName: string;
    studentRoll: string;
    sectionName: string;
    subjectCode: string;
  }>;
  availableSections: Array<{
    id: string;
    name: string;
    program: string;
  }>;
  metrics: {
    subjectsTaughtCount: number;
    activeAssignmentsCount: number;
    pendingSubmissionsCount: number;
    totalSubmissionsCount: number;
    unansweredQueriesCount: number;
  };
}

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSection, setSelectedSection] = useState("BCA - SEC-G3");

  // Faculty Location Edit State
  const [currentLocation, setCurrentLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/teacher/dashboard");
        if (!res.ok) throw new Error("Could not load faculty dashboard.");
        const json = await res.json();
        setData(json);
        setCurrentLocation(json.teacher?.cabinLocation || "Faculty Cabin 204");
        setTempLocation(json.teacher?.cabinLocation || "Faculty Cabin 204");
        if (json.availableSections && json.availableSections.length > 0) {
          setSelectedSection(json.availableSections[0].name);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempLocation.trim()) return;

    setSavingLocation(true);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cabinLocation: tempLocation.trim() }),
      });
      if (res.ok) {
        setCurrentLocation(tempLocation.trim());
        setEditingLocation(false);
      }
    } catch (err) {
      console.error("Location update failed:", err);
    } finally {
      setSavingLocation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading Faculty Console...</p>
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

  const { teacher, allocatedSubjects, assignments, gradingQueue, queries, availableSections, metrics } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Clean Faculty Header & Instant Location Changer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
            {teacher.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{teacher.designation}</span>
          </div>
        </div>

        {/* Dynamic Location Updater Widget (Requirement 15) */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          {!editingLocation ? (
            <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-4 py-2 shadow-xs w-72">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#F59E0B]" />
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Current Location:</span>
                  <span className="font-semibold text-slate-800">{currentLocation}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLocation(true)}
                title="Change your current room/location"
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateLocation} className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs w-72">
              <input
                type="text"
                required
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                placeholder="e.g. Lab 3, Block B"
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#15193B] text-slate-900 flex-1 min-w-0 mr-2"
              />
              <div className="flex items-center space-x-1">
              <button
                type="submit"
                disabled={savingLocation}
                className="p-1.5 bg-[#15193B] text-white rounded-xl hover:bg-[#1e2352] cursor-pointer"
                title="Save Location"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingLocation(false);
                  setTempLocation(currentLocation);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 2. Faculty KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Subjects</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-[#0F172A]">
            {metrics.subjectsTaughtCount}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Tasks</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-[#0F172A]">
            {metrics.activeAssignmentsCount}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending Grading</span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-[#D97706]">
            {metrics.pendingSubmissionsCount}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Inquiries</span>
            <HelpCircle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-purple-700">
            {metrics.unansweredQueriesCount}
          </div>
        </div>
      </div>

      {/* 3. Grading Queue & Recent Coursework */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Grading Queue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-bold text-[#0F172A]">
              Grading Queue
            </h2>
            <Link
              href="/teacher/submissions"
              className="text-xs font-semibold text-[#15193B] hover:text-indigo-600 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {gradingQueue.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Grading queue is up to date.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {gradingQueue.slice(0, 5).map((sub) => (
                <div
                  key={sub.submissionId}
                  className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 line-clamp-1">
                      {sub.assignmentTitle}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {sub.studentName} • {sub.section}
                    </div>
                  </div>

                  <Link
                    href={`/teacher/submissions`}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-semibold flex-shrink-0 transition-colors"
                  >
                    Grade
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Inquiries */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-bold text-[#0F172A]">
              Student Inquiries
            </h2>
            <Link
              href="/teacher/queries"
              className="text-xs font-semibold text-[#15193B] hover:text-indigo-600 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {queries.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No unanswered inquiries.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queries.slice(0, 5).map((q) => (
                <div
                  key={q.id}
                  className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 line-clamp-1">
                      {q.title}
                    </div>
                    <div className="text-slate-500 text-[11px] truncate">
                      {q.studentName} • [{q.subjectCode}]
                    </div>
                  </div>

                  <Link
                    href="/teacher/queries"
                    className="px-2.5 py-1 bg-[#15193B] text-white hover:bg-[#1e2352] rounded-lg text-xs font-semibold flex-shrink-0 transition-colors"
                  >
                    Reply
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
