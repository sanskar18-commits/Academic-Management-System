"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  AlertTriangle,
  User,
  MapPin,
} from "lucide-react";

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  isLab: boolean;
  teacher: {
    name: string;
    email: string | null;
    cabinLocation: string;
  };
  activeAssignmentsCount: number;
  nearestDeadline: {
    assignmentId: string;
    title: string;
    dueDate: string;
  } | null;
}

export default function MySubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/student/subjects");
        if (!res.ok) throw new Error("Could not load subjects.");
        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (err: any) {
        setError(err.message || "Failed to load subjects.");
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading Subjects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-900 text-sm">Failed to Load Subjects</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Clean, Simple One-Word Heading */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
          Enrolled Subjects
        </h1>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {subjects.length} Courses
        </span>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => {
          const hasAssignments = sub.activeAssignmentsCount > 0;

          return (
            <div
              key={sub.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                {/* Header Pills: Code, Type, Credits */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-[#0F172A]">
                    {sub.code}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sub.isLab
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {sub.isLab ? "Lab" : "Theory"}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      {sub.credits} Credits
                    </span>
                  </div>
                </div>

                {/* Course Name */}
                <h2 className="text-sm font-heading font-bold text-[#0F172A] leading-snug">
                  {sub.name}
                </h2>

                {/* Faculty Info Card */}
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sub.teacher.name}</span>
                  </div>
                  {sub.teacher.cabinLocation && (
                    <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{sub.teacher.cabinLocation}</span>
                    </div>
                  )}
                </div>

                {/* Assignment Status */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Active Tasks:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                      hasAssignments
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "text-slate-400"
                    }`}
                  >
                    {hasAssignments ? `${sub.activeAssignmentsCount} Active` : "None"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/student/assignments?subjectId=${sub.id}`}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Tasks</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>

                <Link
                  href="/student/queries"
                  className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200/80"
                >
                  Ask
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
