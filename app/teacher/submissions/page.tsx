"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Award,
  BookOpen,
  User,
  X,
  Send,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface SubmissionItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  subjectCode: string;
  subjectName: string;
  maxMarks: number;
  studentName: string;
  studentRoll: string;
  studentEmail: string;
  sectionName: string;
  submittedAt: string;
  status: "SUBMITTED" | "VERIFIED" | "CORRECTION_REQUIRED";
  fileName: string | null;
  fileUrl: string | null;
  submissionText: string | null;
  marksAwarded: number | null;
  feedback: string | null;
}

export default function TeacherSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUBMITTED" | "VERIFIED" | "CORRECTION_REQUIRED">("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");

  // Evaluation modal
  const [activeModalSubmission, setActiveModalSubmission] = useState<SubmissionItem | null>(null);
  const [evalAction, setEvalAction] = useState<"VERIFY" | "CORRECTION">("VERIFY");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/submissions");
      if (!res.ok) throw new Error("Failed to load submissions.");
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const openEvaluationModal = (sub: SubmissionItem) => {
    setActiveModalSubmission(sub);
    setEvalAction(sub.status === "CORRECTION_REQUIRED" ? "CORRECTION" : "VERIFY");
    setFeedbackInput(
      sub.feedback ||
        (sub.status === "VERIFIED"
          ? "Excellent solution formulation with thorough proofs."
          : "Work demonstrates solid understanding. Review feedback annotations.")
    );
  };

  const handleSaveEvaluation = async () => {
    if (!activeModalSubmission) return;

    if (evalAction === "VERIFY") {
      // Verification proceeds without marks
    } else {
      if (!feedbackInput.trim()) {
        alert("Please provide revision guidance notes explaining what needs correction.");
        return;
      }
    }

    setEvalSubmitting(true);
    try {
      const res = await fetch("/api/teacher/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: activeModalSubmission.id,
          action: evalAction,
          marksAwarded: null,
          feedback: feedbackInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update submission.");

      setActiveModalSubmission(null);
      await fetchSubmissions();
    } catch (err: any) {
      alert(err.message || "Could not save evaluation.");
    } finally {
      setEvalSubmitting(false);
    }
  };

  // Extract unique subjects
  const subjectList = Array.from(
    new Set(submissions.map((s) => `${s.subjectCode}: ${s.subjectName}`))
  );

  const filtered = submissions.filter((s) => {
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesSubject =
      selectedSubject === "ALL" || `${s.subjectCode}: ${s.subjectName}` === selectedSubject;
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentRoll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSubject && matchesSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === "SUBMITTED").length;
  const verifiedCount = submissions.filter((s) => s.status === "VERIFIED").length;
  const correctionCount = submissions.filter((s) => s.status === "CORRECTION_REQUIRED").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
          Student Submissions
        </h1>

        <button
          onClick={fetchSubmissions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Total Submissions</div>
          <div className="text-2xl font-bold text-[#0F2848] mt-1">{submissions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged across courses</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting evaluation</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase">Verified</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{verifiedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Completed assessments</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-red-700 uppercase">Corrections Requested</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{correctionCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Returned to students</div>
        </div>
      </div>

      {/* Controls: Tabs & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === "ALL"
                ? "bg-[#0F2848] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setStatusFilter("SUBMITTED")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === "SUBMITTED"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("VERIFIED")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === "VERIFIED"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setStatusFilter("CORRECTION_REQUIRED")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === "CORRECTION_REQUIRED"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Correction ({correctionCount})
          </button>
        </div>

        {/* Search & Subject Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {subjectList.length > 1 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">All Course Subjects</option>
              {subjectList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student, roll, or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2848]"
            />
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white border border-slate-200 rounded-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#0F2848] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-600 font-medium">Loading Student Submissions...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Submissions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? "No submissions matched your search criteria."
              : "No student submissions currently match the selected status filter."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assignment & Subject</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Submission Script</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#0F2848]">{s.studentName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{s.studentRoll}</span>
                        <span>•</span>
                        <span>{s.sectionName}</span>
                      </div>
                    </td>

                    {/* Assignment & Subject */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {s.assignmentTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-[#0F2848]">{s.subjectCode}</span>: {s.subjectName}
                      </div>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(s.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(s.submittedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* Submission Script */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {s.fileUrl ? (
                        <a
                          href={s.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0F2848] border border-slate-200 transition-colors text-[11px] font-medium"
                        >
                          <Download className="w-3 h-3 text-[#0F2848]" />
                          <span className="truncate max-w-[120px]">
                            {s.fileName || "Student_PDF.pdf"}
                          </span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          Physical Submission
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {s.status === "VERIFIED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          VERIFIED
                        </span>
                      ) : s.status === "CORRECTION_REQUIRED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 w-max">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          CORRECTION
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-max">
                          <Clock className="w-3 h-3 text-amber-600" />
                          PENDING
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEvaluationModal(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                          s.status === "SUBMITTED"
                            ? "bg-[#0F2848] text-white hover:bg-[#1B3F6B]"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        {s.status === "SUBMITTED" ? "Evaluate" : "Review / Re-grade"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evaluation & Grading Modal */}
      {activeModalSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0F2848] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706] uppercase tracking-wider">
                  <FileCheck className="w-4 h-4" />
                  Submission Evaluation Docket
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  {activeModalSubmission.studentName} ({activeModalSubmission.studentRoll})
                </h3>
              </div>
              <button
                onClick={() => setActiveModalSubmission(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Submission Context Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Assignment:</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {activeModalSubmission.assignmentTitle}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Course:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {activeModalSubmission.subjectCode} - {activeModalSubmission.subjectName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Submitted At:</span>
                  <div className="font-medium text-slate-700 mt-0.5">
                    {new Date(activeModalSubmission.submittedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Student Submission Artifact */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Student Script & Attachments
                </label>
                {activeModalSubmission.fileUrl ? (
                  <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-blue-100 text-[#0F2848]">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {activeModalSubmission.fileName || "student_submission_script.pdf"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Digital PDF Submission • Ready for verification
                        </div>
                      </div>
                    </div>
                    <a
                      href={activeModalSubmission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#0F2848] text-white text-xs font-semibold rounded-lg hover:bg-[#1B3F6B] transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#D97706]" />
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    Student has deposited a physical hard-copy at faculty cabin. Verify the physical manuscript.
                  </div>
                )}

                {activeModalSubmission.submissionText && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-line">
                    <span className="font-semibold text-slate-800 block mb-1">Student Note:</span>
                    {activeModalSubmission.submissionText}
                  </div>
                )}
              </div>

              {/* Evaluation Action Switcher */}
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEvalAction("VERIFY")}
                    className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      evalAction === "VERIFY"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verify Submission
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalAction("CORRECTION")}
                    className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      evalAction === "CORRECTION"
                        ? "bg-white text-red-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Request Student Correction
                  </button>
                </div>

                {evalAction === "VERIFY" ? (
                  <div className="space-y-4 bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Academic Feedback / Remarks
                      </label>
                      <textarea
                        rows={3}
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Provide feedback on methodology, derivation accuracy, and presentation..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-red-50/40 border border-red-200/80 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-red-800 font-semibold">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Specify Revision Requirements
                    </div>
                    <p className="text-[11px] text-slate-600">
                      The submission will be set to <span className="font-bold text-red-700">CORRECTION_REQUIRED</span>. The student will receive a notification and be permitted to re-upload their corrected manuscript.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Required Corrections & Guidance Notes <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="e.g., Problem 3 derivation is incomplete. Please re-check the AVL rotation proofs and resubmit before Friday..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={evalSubmitting}
                onClick={() => setActiveModalSubmission(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={evalSubmitting}
                onClick={handleSaveEvaluation}
                className={`px-5 py-2 text-xs font-bold rounded-lg text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60 ${
                  evalAction === "VERIFY"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {evalSubmitting
                  ? "Recording Evaluation..."
                  : evalAction === "VERIFY"
                  ? "Verify Submission"
                  : "Dispatch Correction Notice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
