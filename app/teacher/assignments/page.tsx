"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Eye,
  Layers,
  ArrowUpDown,
  BookOpen,
  Users,
} from "lucide-react";

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  instructions: string;
  submissionMethod: "ONLINE" | "PHYSICAL";
  teacherLocation: string | null;
  assignedDate: string;
  dueDate: string;
  maxMarks: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  subject: {
    id: string;
    code: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  resources: any[];
  submissionsCount: number;
  evaluatedCount: number;
}

function TeacherAssignmentsContent() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "DRAFT" | "ARCHIVED">("ALL");
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [manualMarkId, setManualMarkId] = useState<string | null>(null);
  const [rollNumbersInput, setRollNumbersInput] = useState("");
  const [isMarking, setIsMarking] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/assignments");
      if (!res.ok) throw new Error("Failed to load assignments.");
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (err: any) {
      setError(err.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleStatusChange = async (id: string, newStatus: "ACTIVE" | "ARCHIVED" | "DRAFT") => {
    try {
      const res = await fetch(`/api/teacher/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      await fetchAssignments();
    } catch (err: any) {
      alert(err.message || "Could not update status.");
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teacher/assignments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete assignment.");
      setDeleteModalId(null);
      await fetchAssignments();
    } catch (err: any) {
      alert(err.message || "Could not delete assignment.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = assignments.filter((a) => {
    const matchesTab = activeTab === "ALL" || a.status === activeTab;
    const matchesSubject = subjectId ? a.subject.id === subjectId : true;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSubject && matchesSearch;
  });

  const activeCount = assignments.filter((a) => a.status === "ACTIVE").length;
  const draftCount = assignments.filter((a) => a.status === "DRAFT").length;
  const archivedCount = assignments.filter((a) => a.status === "ARCHIVED").length;
  const totalSubmissions = assignments.reduce((acc, curr) => acc + curr.submissionsCount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
          Manage Assignments
        </h1>

        <Link
          href="/teacher/assignments/create"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#15193B] text-white text-xs font-semibold rounded-xl hover:bg-[#1e2352] transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
          <span>Create Assignment</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Total Assignments</div>
          <div className="text-2xl font-bold text-[#0F2848] mt-1">{assignments.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all allocated courses</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase">Active Coursework</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Open for student submissions</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase">Drafts Pending</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{draftCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unpublished guidelines</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-[#0F2848] uppercase">Total Submissions</div>
          <div className="text-2xl font-bold text-[#0F2848] mt-1">{totalSubmissions}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Received from students</div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-[#0F2848] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "ACTIVE"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab("DRAFT")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "DRAFT"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Drafts ({draftCount})
          </button>
          <button
            onClick={() => setActiveTab("ARCHIVED")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "ARCHIVED"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Archived ({archivedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assignments or codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2848]"
          />
        </div>
      </div>

      {/* Assignment List Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white border border-slate-200 rounded-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#0F2848] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-600 font-medium">Loading Coursework Ledger...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Assignments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? "No assignments match your search keywords. Try adjusting your query."
              : "No coursework is currently logged in this view. Click 'Create New Assignment' to formulate a new task."}
          </p>
          <Link
            href="/teacher/assignments/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2848] text-white text-xs font-semibold rounded-lg hover:bg-[#1B3F6B]"
          >
            <Plus className="w-3.5 h-3.5 text-[#D97706]" />
            Formulate First Assignment
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Assignment & Subject</th>
                  <th className="py-3 px-4">Cohort</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Submissions / Evaluation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((a) => {
                  const isOverdue = new Date(a.dueDate) < new Date();
                  const evalPercent =
                    a.submissionsCount > 0
                      ? Math.round((a.evaluatedCount / a.submissionsCount) * 100)
                      : 0;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Assignment & Subject */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-[#0F2848] line-clamp-1">{a.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-700">{a.subject.code}</span>
                          <span>•</span>
                          <span className="truncate">{a.subject.name}</span>
                        </div>
                      </td>

                      {/* Section */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                          {a.section.name}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(a.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(a.dueDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {a.submissionMethod === "ONLINE" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Online PDF
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Physical Drop-off
                          </span>
                        )}
                      </td>

                      {/* Submissions & Progress */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-700">
                            {a.submissionsCount} Received
                          </span>
                          <span className="text-slate-500">{a.evaluatedCount} graded</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0F2848] h-full rounded-full transition-all"
                            style={{ width: `${evalPercent}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {a.status === "ACTIVE" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ACTIVE
                          </span>
                        ) : a.status === "DRAFT" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            DRAFT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            ARCHIVED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setManualMarkId(a.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Manual Submission Marking"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          <Link
                            href={`/teacher/assignments/${a.id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-[#0F2848] hover:bg-slate-100 rounded transition-colors"
                            title="Edit Assignment"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {a.status === "DRAFT" ? (
                            <button
                              onClick={() => handleStatusChange(a.id, "ACTIVE")}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                              title="Publish assignment"
                            >
                              Publish
                            </button>
                          ) : a.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleStatusChange(a.id, "ARCHIVED")}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Archive assignment"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(a.id, "ACTIVE")}
                              className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors"
                              title="Unarchive assignment"
                            >
                              Restore
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteModalId(a.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Delete Assignment?</h3>
                <p className="text-xs text-slate-500">This action will remove the coursework record.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you wish to delete this assignment and its rubric definitions? Submissions associated with this assignment may be affected.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteModalId)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Marking Modal */}
      {manualMarkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-indigo-100 text-indigo-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Manual Submission Marking</h3>
                <p className="text-[11px] text-slate-500">Enter roll numbers to mark as Submitted.</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Numbers (Space-separated)
              </label>
              <textarea
                rows={4}
                value={rollNumbersInput}
                onChange={(e) => setRollNumbersInput(e.target.value)}
                placeholder="e.g. 01 04 07 12 18 21"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isMarking}
                onClick={() => {
                  setManualMarkId(null);
                  setRollNumbersInput("");
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMarking}
                onClick={async () => {
                  setIsMarking(true);
                  try {
                    await fetch(`/api/teacher/assignments/${manualMarkId}/manual-mark`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ rollNumbers: rollNumbersInput })
                    });
                    setManualMarkId(null);
                    setRollNumbersInput("");
                    fetchAssignments();
                  } catch (err) {
                    alert("Failed to mark submissions.");
                  } finally {
                    setIsMarking(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {isMarking ? "Marking..." : "Mark as Submitted"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherAssignmentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-[#0F2848] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <TeacherAssignmentsContent />
    </Suspense>
  );
}
