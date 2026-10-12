"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  Mic,
  MicOff,
  Upload,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Paperclip,
  Trash2,
  HelpCircle,
  Award,
  Layers,
  FileCheck,
  Code2,
  Image as ImageIcon,
  Video,
  FileCode,
  FolderArchive,
  Plus,
  Link as LinkIcon,
  ExternalLink,
  X,
  File,
} from "lucide-react";

interface SubjectOption {
  subjectId: string;
  code: string;
  name: string;
  sectionId: string;
  sectionName: string;
  isLab: boolean;
}

interface ResourceItem {
  id: string;
  title: string;
  fileName?: string;
  fileType: "PDF" | "IMAGE" | "VIDEO" | "CODE" | "DOCUMENT";
  fileUrl: string;
  fileSize?: string;
}

export default function CreateAssignmentPage() {
  const router = useRouter();

  // Form State
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(""); // subjectId_sectionId
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assignedDate, setAssignedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0] + "T23:59";
  });
  const [allowOnlinePdf, setAllowOnlinePdf] = useState(true);
  const [teacherLocation, setTeacherLocation] = useState("Faculty Cabin 204, CS Block B, 2nd Floor");
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // Multi-Resource Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceMode, setResourceMode] = useState<"UPLOAD" | "PRESET" | "LINK">("UPLOAD");
  const [isDragOver, setIsDragOver] = useState(false);
  const [resTitle, setResTitle] = useState("");
  const [resType, setResType] = useState<"PDF" | "IMAGE" | "VIDEO" | "CODE" | "DOCUMENT">("PDF");
  const [resUrl, setResUrl] = useState("");

  // Loading & submission state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch teacher's subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/teacher/subjects");
        if (!res.ok) throw new Error("Failed to load allocated subjects.");
        const data = await res.json();
        const options: SubjectOption[] = (data.subjects || []).map((s: any) => ({
          subjectId: s.id,
          code: s.code,
          name: s.name,
          sectionId: s.sectionId,
          sectionName: s.sectionName,
          isLab: s.isLab,
        }));
        setSubjects(options);
        if (options.length > 0) {
          setSelectedSubjectKey(`${options[0].subjectId}_${options[0].sectionId}`);
        }
      } catch (err: any) {
        setError(err.message || "Failed to initialize subject options.");
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  // Helper: Format bytes into human-readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Helper: Automatically detect resource category from extension
  const detectResourceType = (fileName: string): "PDF" | "IMAGE" | "VIDEO" | "CODE" | "DOCUMENT" => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "PDF";
    if (["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext)) return "IMAGE";
    if (["mp4", "webm", "mov", "mkv"].includes(ext)) return "VIDEO";
    if (["cpp", "c", "h", "hpp", "py", "java", "js", "ts", "tsx", "jsx", "zip", "tar", "gz"].includes(ext)) return "CODE";
    return "DOCUMENT";
  };

  // Multiple files selected from file dialog
  const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: ResourceItem[] = Array.from(files).map((file, idx) => {
      const detectedType = detectResourceType(file.name);
      return {
        id: "res_" + Date.now() + "_" + idx + "_" + Math.random().toString(36).substring(7),
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileType: detectedType,
        fileUrl: `/uploads/assignments/${encodeURIComponent(file.name)}`,
        fileSize: formatFileSize(file.size),
      };
    });

    setResources((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag and drop handler for multiple files
  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newItems: ResourceItem[] = Array.from(files).map((file, idx) => {
      const detectedType = detectResourceType(file.name);
      return {
        id: "res_" + Date.now() + "_" + idx + "_" + Math.random().toString(36).substring(7),
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileType: detectedType,
        fileUrl: `/uploads/assignments/${encodeURIComponent(file.name)}`,
        fileSize: formatFileSize(file.size),
      };
    });

    setResources((prev) => [...prev, ...newItems]);
  };

  // Quick preset click handler
  const handleAddPreset = (
    presetTitle: string,
    type: "PDF" | "IMAGE" | "VIDEO" | "CODE" | "DOCUMENT",
    fileName: string,
    size: string
  ) => {
    const item: ResourceItem = {
      id: "res_" + Date.now() + "_" + Math.random().toString(36).substring(7),
      title: presetTitle,
      fileName,
      fileType: type,
      fileUrl: `/resources/assignments/${fileName}`,
      fileSize: size,
    };
    setResources((prev) => [...prev, item]);
  };

  // Add manual link / URL resource
  const handleAddLinkResource = () => {
    if (!resTitle.trim()) {
      alert("Please enter a title for the resource link.");
      return;
    }
    const item: ResourceItem = {
      id: "res_" + Date.now() + "_" + Math.random().toString(36).substring(7),
      title: resTitle.trim(),
      fileName: resUrl.trim() || `${resTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileType: resType,
      fileUrl: resUrl.trim() || `/resources/assignments/${resTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: "External URL",
    };
    setResources((prev) => [...prev, item]);
    setResTitle("");
    setResUrl("");
  };

  const handleRemoveResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAllResources = () => {
    if (confirm("Are you sure you want to remove all attached resources?")) {
      setResources([]);
    }
  };

  // Submit assignment
  const handleSubmit = async (publishStatus: "ACTIVE" | "DRAFT") => {
    if (!title.trim()) {
      alert("Please enter an assignment title.");
      return;
    }
    if (!description.trim()) {
      alert("Please provide a brief assignment summary.");
      return;
    }
    if (!selectedSubjectKey) {
      alert("Please select a subject and section.");
      return;
    }

    const [subjectId, sectionId] = selectedSubjectKey.split("_");

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        subjectId,
        sectionId,
        description: description.trim(),
        instructions: instructions.trim() || "Complete the assignment as instructed.",
        submissionMethod: "ONLINE",
        teacherLocation: null,
        dueDate: new Date(dueDate).toISOString(),
        maxMarks: 0,
        status: publishStatus,
        resources: resources.map((r) => ({
          title: r.title,
          fileName: r.fileName || r.title,
          fileType: r.fileType,
          resourceType: r.fileType,
          fileUrl: r.fileUrl,
          fileSize: r.fileSize || "1.5 MB",
        })),
      };

      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create assignment.");

      setSuccess(true);
      setTimeout(() => {
        router.push("/teacher/assignments");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the assignment.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0F2848] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Loading Faculty Curriculum Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            <Link
              href="/teacher/assignments"
              className="hover:text-[#0F2848] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Assignments Hub
            </Link>
            <span>/</span>
            <span className="text-[#0F2848]">Create New Assignment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2848]">
            Create Course Assignment
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Formulate assignment guidelines, attach reference literature, and configure submission requirements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit("DRAFT")}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit("ACTIVE")}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#0F2848] text-white hover:bg-[#1B3F6B] transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4 text-[#D97706]" />
            Publish Assignment
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>Assignment published successfully! Redirecting to assignment repository...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Core Assignment Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Course Information */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#0F2848] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-[#D97706]" />
              Course & Identity
            </h2>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Allocated Subject & Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubjectKey}
                  onChange={(e) => setSelectedSubjectKey(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2848]/20 focus:border-[#0F2848]"
                >
                  {subjects.map((sub) => (
                    <option
                      key={`${sub.subjectId}_${sub.sectionId}`}
                      value={`${sub.subjectId}_${sub.sectionId}`}
                    >
                      {sub.code}: {sub.name} ({sub.sectionName})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Assignments are automatically constrained to enrolled section cohorts.
                </p>
              </div>


            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assignment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Practical Implementation of AVL Balanced Search Trees"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2848]/20 focus:border-[#0F2848] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Brief Overview & Objectives <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Concise overview summarizing expected learning outcomes and focus topics..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2848]/20 focus:border-[#0F2848]"
              />
            </div>
          </div>

          {/* Section 2: Detailed Instructions & Student Guidelines */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0F2848] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D97706]" />
                Detailed Instructions & Student Guidelines
              </h2>
              <span className="text-xs text-slate-500 font-medium">Markdown Supported</span>
            </div>

            <textarea
              rows={8}
              placeholder={`Provide step-by-step problem statements, format directives, and grading rubrics:\n\nAssignment Requirements:\n• Solve all designated problem sets with theoretical proofs\n• Include execution output screenshots and complexity analysis\n• Maximum 10 pages\n• Submit as PDF before deadline`}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-3 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2848]/20 focus:border-[#0F2848] bg-slate-50/50"
            />
          </div>

          {/* Section 3: Multi-Resource Materials & Attachments Center */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-heading font-bold text-[#0F2848] flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-[#F59E0B]" />
                  Reference Materials &amp; Study Resources
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach multiple reference PDFs, starter codes, diagrams, or video tutorials for this assignment.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {resources.length} Resource{resources.length !== 1 ? "s" : ""} Attached
                </span>
                {resources.length > 1 && (
                  <button
                    type="button"
                    onClick={handleClearAllResources}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer px-2 py-1 hover:bg-red-50 rounded"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Upload Method Mode Selector Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setResourceMode("UPLOAD")}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  resourceMode === "UPLOAD"
                    ? "bg-white text-[#0F2848] shadow-xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload Multiple Files</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceMode("PRESET")}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  resourceMode === "PRESET"
                    ? "bg-white text-[#0F2848] shadow-xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Quick Academic Presets</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceMode("LINK")}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  resourceMode === "LINK"
                    ? "bg-white text-[#0F2848] shadow-xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Web / Repo Link</span>
              </button>
            </div>

            {/* Mode 1: Drag & Drop Multi-File Zone */}
            {resourceMode === "UPLOAD" && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropFiles}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-[#4338CA] bg-indigo-50/50 scale-[1.01]"
                    : "border-slate-300 hover:border-[#4338CA] hover:bg-slate-50/60 bg-slate-50/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleMultipleFileUpload}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200/60">
                  <Upload className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-heading font-bold text-slate-800">
                  Click to select multiple files or drag &amp; drop here
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Supports uploading multiple PDF documents, code files (.zip, .cpp, .py), presentation slides, diagrams, and video walkthroughs at once.
                </p>

                <div className="mt-4 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs hover:border-[#4338CA]">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Multiple Files</span>
                </div>
              </div>
            )}

            {/* Mode 2: Quick Academic Presets */}
            {resourceMode === "PRESET" && (
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-semibold text-slate-700">
                  Click any standard coursework preset to attach to this assignment:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      handleAddPreset("Problem Statement & Specifications", "PDF", "problem_statement_spec.pdf", "1.2 MB")
                    }
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-left transition-all group cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-[#0F2848]">
                        + Problem Statement PDF
                      </div>
                      <div className="text-[10px] text-slate-400">Formal problem rubric (1.2 MB)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddPreset("Starter Code & Boilerplate Skeleton", "CODE", "starter_code_skeleton.zip", "3.4 MB")
                    }
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-[#0F2848]">
                        + Starter Code &amp; Skeleton (.zip)
                      </div>
                      <div className="text-[10px] text-slate-400">C++ / Java skeleton project (3.4 MB)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddPreset("Lecture Slides & Theoretical Background", "DOCUMENT", "unit_lecture_slides.pdf", "4.1 MB")
                    }
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group cursor-pointer"
                  >
                    <File className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-[#0F2848]">
                        + Lecture Slides &amp; Formulas
                      </div>
                      <div className="text-[10px] text-slate-400">Classroom reference deck (4.1 MB)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddPreset("Evaluation Rubric & Marking Scheme", "PDF", "evaluation_rubric_scheme.pdf", "850 KB")
                    }
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-all group cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-[#0F2848]">
                        + Evaluation Rubric (PDF)
                      </div>
                      <div className="text-[10px] text-slate-400">Detailed grading breakdown (850 KB)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddPreset("Lab Practical Walkthrough Demo", "VIDEO", "lab_demo_walkthrough.mp4", "18.5 MB")
                    }
                    className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition-all group cursor-pointer sm:col-span-2"
                  >
                    <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-[#0F2848]">
                        + Lab Demonstration Video Walkthrough (MP4)
                      </div>
                      <div className="text-[10px] text-slate-400">Faculty video recorded experiment tutorial (18.5 MB)</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Web / External Link Adder */}
            {resourceMode === "LINK" && (
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-semibold text-slate-700">Attach External Academic Link:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Resource Label (e.g. GitHub Repository, Drive Folder)"
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as any)}
                    className="px-2.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="PDF">Document (PDF)</option>
                    <option value="CODE">Source Code / Repo</option>
                    <option value="VIDEO">Video Tutorial</option>
                    <option value="IMAGE">Diagram / Visual</option>
                    <option value="DOCUMENT">General Document</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://github.com/geu-cs/... or https://drive.google.com/..."
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddLinkResource}
                    className="px-4 py-2 bg-[#4338CA] text-white text-xs font-semibold rounded-xl hover:bg-[#3730A3] transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>
              </div>
            )}

            {/* Attached Resources Inventory List */}
            {resources.length > 0 ? (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Attached Files ({resources.length}):
                  </span>
                  <span className="text-[11px]">Students will be able to download/access all these files</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {resources.map((res) => {
                    return (
                      <div
                        key={res.id}
                        className="flex items-center justify-between p-3 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs transition-all"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                            {res.fileType === "PDF" && <FileText className="w-4 h-4 text-red-500" />}
                            {res.fileType === "IMAGE" && <ImageIcon className="w-4 h-4 text-blue-500" />}
                            {res.fileType === "VIDEO" && <Video className="w-4 h-4 text-purple-600" />}
                            {res.fileType === "CODE" && <Code2 className="w-4 h-4 text-emerald-600" />}
                            {res.fileType === "DOCUMENT" && <File className="w-4 h-4 text-slate-600" />}
                          </div>

                          <div className="truncate">
                            <div className="font-semibold text-slate-900 truncate">
                              {res.title}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-slate-500 truncate max-w-[140px]">
                                {res.fileName || res.fileUrl}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-slate-600">{res.fileSize || "1.2 MB"}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveResource(res.id)}
                          title="Remove resource"
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-slate-200/60">
                No reference files attached yet. You can attach multiple resources using the file uploader or presets above.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Schedule, Mode & AI Assistant */}
        <div className="space-y-6">
          {/* Submission Configuration Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#0F2848] flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Clock className="w-4 h-4 text-[#D97706]" />
              Submission Deadlines & Protocol
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Assigned
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2848]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Submission Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F2848] font-medium text-[#0F2848]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Submissions after this timestamp will trigger an overdue indicator.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Submission Method
              </label>
              {/* ONLINE PORTAL ONLY */}
              <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg">
                <input
                  type="checkbox"
                  id="allowPdf"
                  checked={allowOnlinePdf}
                  onChange={(e) => setAllowOnlinePdf(e.target.checked)}
                  className="w-4 h-4 text-[#0F2848] rounded border-slate-300 focus:ring-[#0F2848]"
                />
                <label htmlFor="allowPdf" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Allow online PDF upload (Max 25MB)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
