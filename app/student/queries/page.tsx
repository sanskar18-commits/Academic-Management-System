"use client";

import { useEffect, useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
} from "lucide-react";

interface QueryItem {
  id: string;
  queryCode: string;
  title: string;
  question: string;
  status: string;
  workflowStep: "SUBMITTED" | "AI_CLASSIFICATION" | "WAITING_FOR_TEACHER" | "ANSWERED";
  systemPriority: "HIGH" | "MEDIUM" | "LOW" | "ROUTINE" | "NORMAL" | "URGENT";
  aiCategory: string;
  createdAt: string;
  subject: {
    id: string;
    code: string;
    name: string;
  };
  teacher: {
    name: string;
    email: string;
    department: string;
  };
  assignment: {
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

interface SubjectChoice {
  id: string;
  code: string;
  name: string;
  teacher: {
    id?: string;
    name: string;
    cabinLocation: string;
  };
}

export default function AskTeacherPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [queryTitle, setQueryTitle] = useState("");
  const [queryDescription, setQueryDescription] = useState("");

  useEffect(() => {
    async function initData() {
      try {
        const [qRes, sRes] = await Promise.all([
          fetch("/api/student/queries"),
          fetch("/api/student/subjects"),
        ]);

        if (qRes.ok) {
          const qData = await qRes.json();
          setQueries(qData.queries || []);
        }

        if (sRes.ok) {
          const sData = await sRes.json();
          const fetchedSubjects: SubjectChoice[] = sData.subjects || [];

          // Add PBL Mentor and Mini Project Mentor if not already present
          const hasPbl = fetchedSubjects.some((s) => s.code === "PBL-MENTOR");
          const hasMini = fetchedSubjects.some((s) => s.code === "MINI-PROJECT");

          const allOptions: SubjectChoice[] = [...fetchedSubjects];
          if (!hasPbl) {
            allOptions.push({
              id: "PBL-MENTOR",
              code: "PBL",
              name: "PBL (Project Based Learning) Mentor",
              teacher: {
                name: "PBL Project Mentor",
                cabinLocation: "Project Lab, CS Block",
              },
            });
          }
          if (!hasMini) {
            allOptions.push({
              id: "MINI-PROJECT",
              code: "MINI-PROJ",
              name: "Mini Project Mentor",
              teacher: {
                name: "Mini Project Mentor",
                cabinLocation: "Innovation Wing",
              },
            });
          }

          setSubjects(allOptions);
          if (allOptions.length > 0) {
            setSelectedSubjectId(allOptions[0].id);
          }
        }
      } catch (err: any) {
        console.error("Init query data error:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(null);

    if (!selectedSubjectId || !queryTitle.trim() || !queryDescription.trim()) {
      setFormError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/student/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          teacherId: selectedSubject?.teacher?.id || null,
          title: queryTitle,
          description: queryDescription,
          assignmentId: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      setFormSuccess(data.message || "Query submitted successfully.");
      setQueryTitle("");
      setQueryDescription("");

      const refreshRes = await fetch("/api/student/queries");
      if (refreshRes.ok) {
        const refData = await refreshRes.json();
        setQueries(refData.queries || []);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to submit inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading Inquiries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Simple, Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
          Ask Teacher
        </h1>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {queries.length} Inquiries
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inquiry Submission Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-heading font-bold text-[#0F172A]">
              New Inquiry
            </h2>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitQuery} className="space-y-3.5">
              {/* Select Subject with Mentors */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Course / Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#15193B] text-slate-900 font-medium"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.code}] {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Assigned Mentor / Faculty */}
              {selectedSubject && (
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-0.5">
                  <div className="text-[11px] text-slate-400">Assigned Faculty / Mentor:</div>
                  <div className="font-semibold text-slate-800">{selectedSubject.teacher.name}</div>
                  {selectedSubject.teacher.cabinLocation && (
                    <div className="text-[11px] text-slate-500">{selectedSubject.teacher.cabinLocation}</div>
                  )}
                </div>
              )}

              {/* Query Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inquiry Title *
                </label>
                <input
                  type="text"
                  required
                  value={queryTitle}
                  onChange={(e) => setQueryTitle(e.target.value)}
                  placeholder="Brief summary of your question"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#15193B] text-slate-900 font-medium"
                />
              </div>

              {/* Query Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={queryDescription}
                  onChange={(e) => setQueryDescription(e.target.value)}
                  placeholder="State your question or doubt clearly..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#15193B] text-slate-900 leading-relaxed font-normal"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#15193B] hover:bg-[#1e2352] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{submitting ? "Submitting..." : "Send Inquiry"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Inquiries List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-heading font-bold text-[#0F172A]">
              Inquiry Records
            </h2>

            {queries.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No inquiries submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queries.map((q) => {
                  const isResolved = q.status === "RESOLVED" || q.workflowStep === "ANSWERED";

                  return (
                    <div
                      key={q.id}
                      className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {q.queryCode}
                          </span>
                          <span className="text-xs text-slate-500">
                            {q.subject.name}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isResolved
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {isResolved ? "Answered" : "Waiting for Faculty"}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-[#0F172A]">
                        {q.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {q.question}
                      </p>

                      {/* Responses */}
                      {q.responses && q.responses.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
                          {q.responses.map((r) => (
                            <div
                              key={r.id}
                              className="bg-white border border-slate-200/80 rounded-xl p-3 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-800">{r.author} (Faculty)</span>
                                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">
                                {r.responseText}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
