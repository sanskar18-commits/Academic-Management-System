"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  ChevronRight,
  FileText,
  Download,
} from "lucide-react";

interface SubmissionRecord {
  id: string;
  submittedAt: string;
  status: string;
  fileName: string | null;
  fileUrl: string | null;
  marksAwarded: number | null;
  feedback: string | null;
  assignment: {
    id: string;
    title: string;
    maxMarks: number;
    subject: {
      code: string;
      name: string;
    };
    teacher?: {
      user?: {
        name?: string;
      };
    };
  };
}

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const res = await fetch("/api/student/dashboard");
        if (!res.ok) throw new Error("Could not retrieve submissions.");
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } catch (err: any) {
        setError(err.message || "Failed to load submission records.");
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-3 border-[#0F2848] border-t-[#D97706] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-600">Retrieving Submitted Coursework...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-900 text-sm">Failed to Load Submissions</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
          Submissions
        </h1>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {submissions.length} Total
        </span>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500 text-xs">
            <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="font-semibold text-slate-700 text-sm">No submissions recorded yet</span>
            <p className="mt-1">When you submit assignments online, their evaluation status will appear here.</p>
            <Link
              href="/student/assignments"
              className="inline-block mt-3 px-4 py-2 bg-[#0F2848] text-white rounded text-xs font-semibold"
            >
              Browse Active Assignments
            </Link>
          </div>
        ) : (
          submissions.map((sub) => {
            const isVerified = sub.status === "VERIFIED" || sub.marksAwarded !== null;

            return (
              <div
                key={sub.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-5 shadow-sm space-y-4 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#0F2848] border border-slate-200">
                        {sub.assignment.subject.code}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {sub.assignment.subject.name}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isVerified
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isVerified ? "Verified / Graded" : sub.status}
                      </span>
                    </div>

                    <h3 className="text-base font-heading font-bold text-[#0F2848]">
                      {sub.assignment.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 pt-1">
                      <span className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Evaluator: {sub.assignment.teacher?.user?.name || "Assigned Faculty"}</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Submitted: {new Date(sub.submittedAt).toLocaleString()}</span>
                      </span>
                      {sub.fileName && (
                        <span className="flex items-center space-x-1.5 text-slate-500 font-mono text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span>{sub.fileName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Evaluation Score Pill */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 min-w-[140px] text-right">
                    {sub.marksAwarded !== null && sub.marksAwarded !== undefined ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-right w-full">
                        <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Grade Awarded</div>
                        <div className="text-xl font-heading font-bold text-emerald-800">
                          {sub.marksAwarded} / {sub.assignment.maxMarks}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-right w-full">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation</div>
                        <div className="text-xs font-semibold text-slate-700">In Faculty Queue</div>
                      </div>
                    )}

                    <Link
                      href={`/student/assignments/${sub.assignment.id}`}
                      className="text-xs font-semibold text-[#143763] hover:text-[#0F2848] flex items-center space-x-1 mt-1"
                    >
                      <span>Task Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Faculty Feedback Section */}
                {sub.feedback && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-md text-xs text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5 text-emerald-900">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Official Faculty Feedback:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5">
                      "{sub.feedback}"
                    </p>
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
