"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Award,
  Layers,
  Save,
  BookOpen,
  Paperclip,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  Code2,
  Image as ImageIcon,
  Video,
  File,
} from "lucide-react";

interface ResourceItem {
  id: string;
  title: string;
  fileName?: string;
  fileType: "PDF" | "IMAGE" | "VIDEO" | "CODE" | "DOCUMENT";
  fileUrl: string;
  fileSize?: string;
}

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [teacherLocation, setTeacherLocation] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT" | "ARCHIVED">("ACTIVE");

  // Multi-Resource State
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceMode, setResourceMode] = useState<"UPLOAD" | "PRESET" | "LINK">("UPLOAD");
  const [isDragOver, setIsDragOver] = useState(false);
  const [resTitle, setResTitle] = useState("");
  const [resType, setResType] = useState<"PDF" | "IMAGE" | "VIDEO" | "CODE" | "DOCUMENT">("PDF");
  const [resUrl, setResUrl] = useState("");

  // Readonly metadata
  const [subjectInfo, setSubjectInfo] = useState<{ code: string; name: string } | null>(null);
  const [sectionName, setSectionName] = useState("");

  useEffect(() => {
    async function loadAssignment() {
      try {
        setLoading(true);
        const res = await fetch(`/api/teacher/assignments/${assignmentId}`);
        if (!res.ok) throw new Error("Failed to load assignment details.");
        const data = await res.json();
        const a = data.assignment;

        setTitle(a.title);
        setDescription(a.description || "");
        setInstructions(a.instructions || "");
        if (a.dueDate) {
          const d = new Date(a.dueDate);
          setDueDate(d.toISOString().slice(0, 16));
        }
        setTeacherLocation(a.teacherLocation || "Faculty Cabin 204, CS Block B");
        setStatus(a.status || "ACTIVE");
        setSubjectInfo(a.subject ? { code: a.subject.code, name: a.subject.name } : null);
        setSectionName(a.section ? a.section.name : "");

        if (a.resources && Array.isArray(a.resources)) {
          setResources(
            a.resources.map((r: any) => ({
              id: r.id,
              title: r.fileName || "Resource Document",
              fileName: r.fileName,
              fileType: r.resourceType || "PDF",
              fileUrl: r.fileUrl,
              fileSize: r.fileSize || "1.5 MB",
            }))
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to load assignment details.");
      } finally {
        setLoading(false);
      }
    }
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  // Helper: Format bytes into human-readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Helper: Automatically detect resource category
  const detectResourceType = (fileName: string): "PDF" | "IMAGE" | "VIDEO" | "CODE" | "DOCUMENT" => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "PDF";
    if (["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext)) return "IMAGE";
    if (["mp4", "webm", "mov", "mkv"].includes(ext)) return "VIDEO";
    if (["cpp", "c", "h", "hpp", "py", "java", "js", "ts", "tsx", "jsx", "zip", "tar", "gz"].includes(ext)) return "CODE";
    return "DOCUMENT";
  };

  // Multiple files upload handler
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

  // Drag and drop handler
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

  // Quick preset adder
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please provide both title and description.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        submissionMethod: "ONLINE",
        teacherLocation: null,
        dueDate: new Date(dueDate).toISOString(),
        maxMarks: 0,
        status,
        resources: resources.map((r) => ({
          title: r.title,
          fileName: r.fileName || r.title,
          fileType: r.fileType,
          resourceType: r.fileType,
          fileUrl: r.fileUrl,
          fileSize: r.fileSize || "1.5 MB",
        })),
      };

      const res = await fetch(`/api/teacher/assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update assignment.");

      setSuccess(true);
      setTimeout(() => {
        router.push("/teacher/assignments");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Could not save changes.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-9 h-9 border-3 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/teacher/assignments"
            className="text-xs font-semibold text-slate-500 hover:text-[#0F2848] flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Assignments
          </Link>
          <h1 className="text-2xl font-heading font-bold text-[#0F2848]">
            Edit Assignment
          </h1>
          {subjectInfo && (
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <span className="font-mono font-bold text-[#4338CA]">{subjectInfo.code}</span>
              <span>•</span>
              <span className="font-medium">{subjectInfo.name}</span>
              {sectionName && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{sectionName}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Assignment updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Metadata */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#0F2848] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-[#4338CA]" />
            Core Assignment Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ACTIVE">ACTIVE (Accepting Submissions)</option>
                <option value="DRAFT">DRAFT (Unpublished)</option>
                <option value="ARCHIVED">ARCHIVED (Closed Coursework)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Brief Overview <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Detailed Instructions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#0F2848] flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#F59E0B]" />
            Detailed Instructions &amp; Guidelines
          </h2>

          <textarea
            rows={6}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-3.5 py-3 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
          />
        </div>

        {/* Section 3: Study Resources & Attachments Center */}
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

          {/* Mode Selector Tabs */}
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
              <span>Quick Presets</span>
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

              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-200/60">
                <Upload className="w-5 h-5" />
              </div>

              <h3 className="text-xs sm:text-sm font-heading font-bold text-slate-800">
                Click to select multiple files or drag &amp; drop here
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
                Upload multiple PDFs, code files (.zip, .cpp), slides, or videos simultaneously.
              </p>
            </div>
          )}

          {/* Mode 2: Quick Presets */}
          {resourceMode === "PRESET" && (
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                Select coursework preset to attach:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleAddPreset("Problem Statement & Specifications", "PDF", "problem_statement_spec.pdf", "1.2 MB")
                  }
                  className="flex items-center space-x-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-left transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">+ Problem Statement PDF</div>
                    <div className="text-[10px] text-slate-400">1.2 MB</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPreset("Starter Code & Skeleton", "CODE", "starter_code.zip", "2.8 MB")
                  }
                  className="flex items-center space-x-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all cursor-pointer"
                >
                  <Code2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">+ Starter Code (.zip)</div>
                    <div className="text-[10px] text-slate-400">2.8 MB</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPreset("Lecture Slides & References", "DOCUMENT", "lecture_slides.pdf", "3.6 MB")
                  }
                  className="flex items-center space-x-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all cursor-pointer"
                >
                  <File className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">+ Lecture Slides Deck</div>
                    <div className="text-[10px] text-slate-400">3.6 MB</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAddPreset("Evaluation Rubric Sheet", "PDF", "evaluation_rubric.pdf", "650 KB")
                  }
                  className="flex items-center space-x-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">+ Evaluation Rubric (PDF)</div>
                    <div className="text-[10px] text-slate-400">650 KB</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Web Link Adder */}
          {resourceMode === "LINK" && (
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Resource Label (e.g. GitHub Repo)"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                />
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as any)}
                  className="px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  <option value="PDF">PDF</option>
                  <option value="CODE">Source Code</option>
                  <option value="VIDEO">Video</option>
                  <option value="IMAGE">Image</option>
                  <option value="DOCUMENT">Document</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="URL link"
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddLinkResource}
                  className="px-3.5 py-1.5 bg-[#4338CA] text-white text-xs font-semibold rounded-xl hover:bg-[#3730A3]"
                >
                  Add Link
                </button>
              </div>
            </div>
          )}

          {/* Resources List */}
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50/90 border border-slate-200/90 rounded-xl text-xs"
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {res.fileType === "PDF" && <FileText className="w-3.5 h-3.5 text-red-500" />}
                      {res.fileType === "IMAGE" && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                      {res.fileType === "VIDEO" && <Video className="w-3.5 h-3.5 text-purple-600" />}
                      {res.fileType === "CODE" && <Code2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {res.fileType === "DOCUMENT" && <File className="w-3.5 h-3.5 text-slate-600" />}
                    </div>

                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">{res.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{res.fileName || res.fileUrl} • {res.fileSize}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveResource(res.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-slate-200/60">
              No reference files attached yet.
            </div>
          )}
        </div>

        {/* Deadlines & Submission Protocol */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#0F2848] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            Submission Deadlines &amp; Protocol
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Submission Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/teacher/assignments"
            className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-[#4338CA] text-white hover:bg-[#3730A3] transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#F59E0B]" />
            <span>{submitting ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
