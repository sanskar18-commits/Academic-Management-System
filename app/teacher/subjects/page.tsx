"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Layers,
  ArrowRight,
  AlertTriangle,
  Building2,
  PlusCircle,
  FileCheck2,
} from "lucide-react";

interface TeacherSubjectItem {
  id: string;
  subjectId: string;
  code: string;
  name: string;
  credits: number;
  isLab: boolean;
  sectionName: string;
  enrolledStudentsCount: number;
  academicYear: string;
  semester: number;
  cabinLocation: string;
  activeAssignmentsCount: number;
}

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<TeacherSubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courseFilter, setCourseFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");

  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/teacher/subjects");
        if (!res.ok) throw new Error("Could not retrieve allocated subjects.");
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
        <div className="w-8 h-8 border-3 border-[#0F2848] border-t-[#D97706] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-600">Retrieving Faculty Course Allocations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-900 text-sm">Course Directory Error</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  const parseCourse = (name: string, code: string) => name.includes(" - ") ? name.split(" - ")[0] : code.split("-")[0];
  const parseSection = (name: string) => name.includes(" - ") ? name.split(" - ")[1] : name;

  const courses = Array.from(new Set(subjects.map(s => parseCourse(s.sectionName, s.code))));
  const semesters = Array.from(new Set(subjects.map(s => s.semester.toString())));
  const sections = Array.from(new Set(subjects.map(s => parseSection(s.sectionName))));

  const filteredSubjects = subjects.filter((s) => {
    const course = parseCourse(s.sectionName, s.code);
    const section = parseSection(s.sectionName);
    const semester = s.semester.toString();

    if (courseFilter !== "ALL" && course !== courseFilter) return false;
    if (semesterFilter !== "ALL" && semester !== semesterFilter) return false;
    if (sectionFilter !== "ALL" && section !== sectionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
          Allocated Subjects
        </h1>

        <Link
          href="/teacher/assignments/create"
          className="px-3.5 py-1.5 bg-[#15193B] hover:bg-[#1e2352] text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
          <span>New Coursework</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course</label>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Semester</label>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Semesters</option>
            {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Section</label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all"
          >
            <div className="space-y-3">
              {/* Badges: Code, Type, Credits */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#0F2848] text-white">
                  {sub.code}
                </span>
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sub.isLab
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {sub.isLab ? "LABORATORY" : "THEORY COURSE"}
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {sub.credits} Credits
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-base font-heading font-bold text-[#0F2848]">
                  {sub.name}
                </h3>
              </div>

              {/* Section & Student Count Meta */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium">Allocated Section:</span>
                  <strong className="text-slate-900">{sub.sectionName}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium">Semester / Batch:</span>
                  <span>Semester {sub.semester} ({sub.academicYear})</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium">Active Assignments:</span>
                  <span className="font-bold text-[#D97706]">{sub.activeAssignmentsCount} Published</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href={`/teacher/assignments?subjectId=${sub.id}`}
                className="flex-1 flex items-center justify-center space-x-1 py-2 px-2.5 bg-[#0F2848] hover:bg-[#143763] text-white rounded text-xs font-semibold transition-colors"
              >
                <span>Assignments</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FBBF24]" />
              </Link>

              <Link
                href={`/teacher/submissions?subjectId=${sub.id}`}
                className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                title="View student submissions"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Submissions</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
