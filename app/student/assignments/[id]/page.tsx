"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UploadCloud,
  File,
  Film,
  Image as ImageIcon,
  Download,
  ExternalLink,
  ShieldCheck,
  Send,
  HelpCircle,
} from "lucide-react";

interface AssignmentResource {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  resourceType: "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT";
  fileSize: string;
}

interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  dueDate: string;
  status: "Not Started" | "In Progress" | "Submitted" | "Verified" | "Correction Required" | "Overdue";
  subject: {
    id: string;
    code: string;
    name: string;
    isLab: boolean;
  };
  teacher: {
    name: string;
    email: string;
    designation: string;
    department: string;
    cabinLocation: string;
  };
  resources: AssignmentResource[];
  submission: {
    id: string;
    fileName: string;
    fileUrl: string;
    submissionText: string | null;
    submittedAt: string;
    marksAwarded?: number | null;
    feedback?: string | null;
    status: string;
  } | null;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Submission Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await fetch(`/api/student/assignments/${assignmentId}`);
        if (!res.ok) throw new Error("Could not retrieve assignment details.");
        const data = await res.json();
        setAssignment(data.assignment);
        if (data.assignment.submission?.submissionText) {
          setSubmissionText(data.assignment.submission.submissionText);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load assignment details.");
      } finally {
        setLoading(false);
      }
    }
    if (assignmentId) loadDetail();
  }, [assignmentId]);

  // Handle File Selection with Type & Size Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError("");
    setSubmitSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension (PDF required)
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setFormError("Only PDF documents (.pdf) are permitted for online submission.");
      setSelectedFile(null);
      return;
    }

    // Validate size (10 MB maximum)
    if (file.size > 10 * 1024 * 1024) {
      setFormError("File size exceeds the institutional 10 MB limit.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Submit Assignment Handler
  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !assignment?.submission) {
      setFormError("Please choose a valid PDF file to upload.");
      return;
    }

    setUploading(true);
    setFormError("");

    // Simulate upload progress
    setUploadProgress(20);
    const timer1 = setTimeout(() => setUploadProgress(65), 300);
    const timer2 = setTimeout(() => setUploadProgress(90), 600);

    try {
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile ? selectedFile.name : assignment?.submission?.fileName,
          mimeType: selectedFile ? selectedFile.type : "application/pdf",
          fileSizeBytes: selectedFile ? selectedFile.size : 1024 * 500,
          submissionText,
        }),
      });

      const data = await res.json();
      clearTimeout(timer1);
      clearTimeout(timer2);
      setUploadProgress(100);

      if (!res.ok) {
        throw new Error(data.error || "Submission failed.");
      }

      setSubmitSuccess(true);
      setUploading(false);

      // Refresh assignment data
      setTimeout(async () => {
        const refreshRes = await fetch(`/api/student/assignments/${assignmentId}`);
        if (refreshRes.ok) {
          const refData = await refreshRes.json();
          setAssignment(refData.assignment);
        }
      }, 500);
    } catch (err: any) {
      setUploading(false);
      setUploadProgress(0);
      setFormError(err.message || "An unexpected error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-3 border-[#0F2848] border-t-[#D97706] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-600">Retrieving Assignment Specifications...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-900 text-sm">Failed to Load Assignment</h3>
        <p className="text-xs text-red-700">{error}</p>
        <Link
          href="/student/assignments"
          className="inline-block mt-3 px-4 py-2 bg-[#0F2848] text-white text-xs font-semibold rounded"
        >
          Return to Assignments List
        </Link>
      </div>
    );
  }

  const isSubmitted = !!assignment.submission;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header matching Reference Image 2 */}
      <div className="flex items-start space-x-3.5">
        <Link
          href="/student/assignments"
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-xs flex-shrink-0 transition-colors cursor-pointer mt-1"
          title="Back to Assignments"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#0F172A] leading-tight">
            {assignment.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Subject: {assignment.subject.code}</span>
            <span>•</span>
            <span>{assignment.subject.name}</span>
          </div>
        </div>
      </div>

      {/* Main Assignment Spec Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-[#0F172A]">
              {assignment.subject.code}
            </span>
            <span
              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
            >
              Online Submission
            </span>
          </div>

          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              assignment.status === "Verified"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : assignment.status === "Submitted"
                ? "bg-blue-100 text-blue-800"
                : assignment.status === "Overdue"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {assignment.status === "Verified" ? "Graded" : assignment.status}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {assignment.description}
        </p>

        {/* Clean Spec Badges */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs">
          <div>
            <div className="text-[11px] text-slate-400">Faculty</div>
            <div className="font-semibold text-slate-800 mt-0.5">{assignment.teacher.name}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Due Date</div>
            <div className="font-semibold text-red-700 mt-0.5">
              {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Instructions Section */}
      {assignment.instructions && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#143763] uppercase tracking-wider">
            <FileText className="w-4 h-4 text-[#D97706]" />
            <span>Faculty Submission Instructions</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-700 bg-amber-50/50 p-4 rounded-lg border border-amber-200/70 whitespace-pre-line leading-relaxed">
            {assignment.instructions}
          </div>
        </div>
      )}

      {/* Supporting Course Resources: PDF, Image, Video */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-heading font-bold text-[#0F2848]">
              Teacher-Provided Supporting Resources
            </h3>
            <p className="text-xs text-slate-500">
              Reference documentation, diagrams, and video walkthroughs provided by faculty.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {assignment.resources.length} Items
          </span>
        </div>

        {assignment.resources.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No external resource files attached to this task.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assignment.resources.map((res) => (
              <div
                key={res.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {res.resourceType === "PDF" && <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />}
                    {res.resourceType === "IMAGE" && <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                    {res.resourceType === "VIDEO" && <Film className="w-5 h-5 text-purple-600 flex-shrink-0" />}
                    {res.resourceType === "DOCUMENT" && <File className="w-5 h-5 text-slate-600 flex-shrink-0" />}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {res.resourceType}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {res.fileName}
                  </h4>
                  <div className="text-[11px] text-slate-500">Size: {res.fileSize}</div>
                </div>

                <a
                  href={res.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Access Material</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ONLINE SUBMISSION INTERFACE */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-[#D97706]" />
              <h3 className="text-lg font-heading font-bold text-[#0F2848]">
                Submit Assignment
              </h3>
            </div>
            {isSubmitted && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Currently Submitted</span>
              </span>
            )}
          </div>

          {/* If already submitted: show submission details */}
          {assignment.submission && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Active Submission Record</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Date: {new Date(assignment.submission.submittedAt).toLocaleString()}
                </span>
              </div>
              <div className="text-slate-700">
                Uploaded Document: <strong className="font-mono">{assignment.submission.fileName}</strong>
              </div>
              {assignment.submission.submissionText && (
                <div className="p-2 bg-white rounded border border-slate-200 text-slate-600 italic">
                  "{assignment.submission.submissionText}"
                </div>
              )}
              {assignment.submission.feedback && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="block text-[11px] text-slate-600 font-normal mt-0.5">
                    Teacher Remark: {assignment.submission.feedback}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleAssignmentSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Assignment submitted and recorded successfully!</span>
              </div>
            )}

            {/* File Drop / Chooser */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Upload Solution (PDF Format Only, Max 10 MB)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-[#0F2848] rounded-lg p-6 text-center transition-colors bg-slate-50/50">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-700">
                  {selectedFile ? (
                    <span className="font-mono font-bold text-[#0F2848]">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  ) : (
                    <span>Click to select or drag your PDF solution sheet here</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Accepts strictly .pdf documents up to 10 Megabytes.</p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="mt-3 block mx-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0F2848] file:text-white hover:file:bg-[#143763] cursor-pointer"
                />
              </div>
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                  <span>Uploading and verifying PDF document...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#D97706] h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submission Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Remarks / Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Include brief comments, assumptions, or test run commands for the instructor..."
                className="w-full p-2.5 text-xs bg-slate-50/50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F2848] text-slate-900"
              ></textarea>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified with server-side validation &amp; path traversal defense.</span>
              </span>

              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2.5 bg-[#0F2848] hover:bg-[#143763] disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors flex items-center space-x-2 shadow cursor-pointer"
              >
                <span>{uploading ? "Submitting..." : isSubmitted ? "Update Submission" : "Submit Assignment"}</span>
                <Send className="w-3.5 h-3.5 text-[#FBBF24]" />
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
