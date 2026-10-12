"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  User,
  BookOpen,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react";

interface QueryItem {
  id: string;
  queryCode: string;
  title: string;
  question: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  waitingTime: string;
  createdAt: string;
  status: "OPEN" | "RESOLVED";
  workflowStep: string;
  aiCategory: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    email: string;
    sectionName: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
  };
  assignment?: {
    id: string;
    title: string;
  } | null;
  responses: Array<{
    id: string;
    author: string;
    isFaculty: boolean;
    responseText: string;
    createdAt: string;
  }>;
}

export default function TeacherQueriesPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "OPEN" | "HIGH" | "RESOLVED">("OPEN");

  // Response Modal State
  const [selectedQuery, setSelectedQuery] = useState<QueryItem | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/queries");
      if (!res.ok) throw new Error("Failed to load student queries.");
      const data = await res.json();
      // Ordering is already prioritized by backend DSA MinHeap/PriorityQueue
      setQueries(data.queries || []);
    } catch (err: any) {
      setError(err.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const openResponseModal = (q: QueryItem) => {
    setSelectedQuery(q);
    setResponseText("");
    setResponseSuccess(false);
  };

  const handleSendResponse = async () => {
    if (!selectedQuery || !responseText.trim()) {
      alert("Please enter a response for the student.");
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const res = await fetch("/api/teacher/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryId: selectedQuery.id,
          responseText: responseText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit response.");

      setResponseSuccess(true);
      setTimeout(async () => {
        setSelectedQuery(null);
        await fetchQueries();
      }, 900);
    } catch (err: any) {
      alert(err.message || "Could not submit response.");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const openCount = queries.filter((q) => q.status === "OPEN").length;
  const highPriorityCount = queries.filter((q) => q.status === "OPEN" && q.priority === "HIGH").length;
  const resolvedCount = queries.filter((q) => q.status === "RESOLVED").length;

  const filtered = queries.filter((q) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "OPEN"
        ? q.status === "OPEN"
        : activeTab === "HIGH"
        ? q.status === "OPEN" && q.priority === "HIGH"
        : q.status === "RESOLVED";

    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.queryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.code.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
          Student Inquiries
        </h1>

        <button
          onClick={fetchQueries}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Total Logged</div>
          <div className="text-2xl font-bold text-[#0F2848] mt-1">{queries.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Queries across allocated courses</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase">Unanswered (Open)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{openCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting faculty guidance</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-red-700 uppercase">HIGH Priority</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{highPriorityCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Require prompt attention</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase">Resolved Queries</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Successfully clarified</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab("OPEN")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "OPEN"
                ? "bg-[#0F2848] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Pending Clarification ({openCount})
          </button>
          <button
            onClick={() => setActiveTab("HIGH")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "HIGH"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            High Priority ({highPriorityCount})
          </button>
          <button
            onClick={() => setActiveTab("RESOLVED")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "RESOLVED"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All History ({queries.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student, code, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2848]"
          />
        </div>
      </div>

      {/* Query List Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white border border-slate-200 rounded-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#0F2848] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-600 font-medium">Sorting Queries via DSA Priority Queue...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Priority Queue Clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? "No queries match your search keywords."
              : "All student queries in this category have been addressed. No pending items in the active queue."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Priority & ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Query Question</th>
                  <th className="py-3 px-4">Waiting Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Priority & ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {q.priority === "HIGH" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            HIGH
                          </span>
                        ) : q.priority === "MEDIUM" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            MEDIUM
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            LOW
                          </span>
                        )}
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {q.queryCode}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{q.aiCategory}</div>
                    </td>

                    {/* Student */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#0F2848]">{q.student.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="font-mono">{q.student.rollNumber}</span>
                        <span>•</span>
                        <span>{q.student.sectionName}</span>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{q.subject.code}</span>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {q.subject.name}
                      </div>
                    </td>

                    {/* Question */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-800 line-clamp-1">{q.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {q.question}
                      </div>
                      {q.assignment && (
                        <div className="mt-1 text-[10px] text-[#0F2848] font-medium flex items-center gap-1">
                          <span>Ref: {q.assignment.title}</span>
                        </div>
                      )}
                    </td>

                    {/* Waiting Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1 text-[11px] font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {q.waitingTime}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {q.status === "RESOLVED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          RESOLVED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          OPEN
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openResponseModal(q)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                          q.status === "OPEN"
                            ? "bg-[#0F2848] text-white hover:bg-[#1B3F6B]"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        {q.status === "OPEN" ? "Answer Query" : "View Resolution"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0F2848] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706] uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" />
                  Academic Query Resolution • {selectedQuery.queryCode}
                </div>
                <h3 className="text-base font-bold mt-0.5">{selectedQuery.title}</h3>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Student Metadata */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Student:</span>
                  <div className="font-bold text-slate-800">
                    {selectedQuery.student.name} ({selectedQuery.student.rollNumber}) •{" "}
                    {selectedQuery.student.sectionName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Course:</span>
                  <div className="font-semibold text-[#0F2848]">
                    {selectedQuery.subject.code}: {selectedQuery.subject.name}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Priority:</span>
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedQuery.priority === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : selectedQuery.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedQuery.priority} PRIORITY
                    </span>
                  </div>
                </div>
              </div>

              {/* Student's Question */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Student Question Statement
                </label>
                <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-lg text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {selectedQuery.question}
                </div>
              </div>

              {/* Existing Response History (if any) */}
              {selectedQuery.responses.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Recorded Responses
                  </label>
                  {selectedQuery.responses.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900">
                        <span>{r.author} (Faculty)</span>
                        <span className="text-slate-400 font-normal">
                          {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-line">{r.responseText}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Faculty Response Input */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Faculty Resolution Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Provide precise academic guidance, reference syllabus page, or advise on approach..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2848]/20 focus:border-[#0F2848]"
                />
                <p className="text-[11px] text-slate-500">
                  Submitting this response will mark the query as{" "}
                  <span className="font-bold text-emerald-700">RESOLVED</span> and transmit an immediate notification to the student.
                </p>
              </div>

              {responseSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Response recorded in SQL! Updating priority queue...</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmittingResponse}
                onClick={() => setSelectedQuery(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSubmittingResponse || !responseText.trim()}
                onClick={handleSendResponse}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-[#0F2848] text-white hover:bg-[#1B3F6B] transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5 text-[#D97706]" />
                {isSubmittingResponse ? "Dispatching..." : "Send Response & Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
