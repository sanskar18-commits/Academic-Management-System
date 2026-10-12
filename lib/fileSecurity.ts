import path from "path";

/**
 * Institutional File Security Engine
 * Enforces strict MIME, extension, size, and path-traversal validation for:
 * 1. Student Submissions: STRICTLY PDF only.
 * 2. Teacher Coursework Resources: STRICTLY PDF, Images, and Video.
 *
 * Prevents executable uploads, shell scripts, path traversals, and unsafe file access.
 */

export const STUDENT_SUBMISSION_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
export const TEACHER_RESOURCE_MAX_BYTES = 100 * 1024 * 1024; // 100 MB

// Dangerous executable & script extensions strictly forbidden across all uploads
export const FORBIDDEN_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".ps1", ".vbs", ".js", ".mjs",
  ".jar", ".scr", ".pif", ".com", ".hta", ".cpl", ".msi", ".dll", ".so",
  ".dylib", ".php", ".phtml", ".php3", ".php4", ".php5", ".asp", ".aspx",
  ".jsp", ".jspx", ".cgi", ".pl", ".pyc", ".class", ".wsf", ".reg"
]);

// Allowed extensions for students
export const STUDENT_ALLOWED_EXTENSIONS = [".pdf"];
export const STUDENT_ALLOWED_MIMES = ["application/pdf", "application/x-pdf"];

// Allowed extensions for teacher resources
export const TEACHER_PDF_EXTENSIONS = [".pdf"];
export const TEACHER_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
export const TEACHER_VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".mkv"];

export const TEACHER_ALLOWED_EXTENSIONS = [
  ...TEACHER_PDF_EXTENSIONS,
  ...TEACHER_IMAGE_EXTENSIONS,
  ...TEACHER_VIDEO_EXTENSIONS,
];

export const TEACHER_ALLOWED_MIMES = [
  // PDF
  "application/pdf",
  "application/x-pdf",
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // Video
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-matroska",
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  detectedType?: "PDF" | "IMAGE" | "VIDEO";
  normalizedMime?: string;
}

/**
 * Sanitizes an uploaded filename to prevent Path Traversal, Null Byte injection,
 * and dangerous executable overrides.
 */
export function sanitizeFilename(originalName: string): string {
  if (!originalName || typeof originalName !== "string") {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.pdf`;
  }

  // 1. Remove path separators (both Windows and Unix) to prevent Path Traversal
  let cleanName = originalName.replace(/[/\\]/g, "_");

  // 2. Remove null bytes and non-printable control characters
  cleanName = cleanName.replace(/[\x00-\x1f\x7f-\x9f]/g, "");

  // 3. Remove dangerous parent directory sequences (.. or ../)
  cleanName = cleanName.replace(/\.\.+/g, ".");

  // 4. Extract safe extension and base name
  const ext = path.extname(cleanName).toLowerCase();
  const rawBase = path.basename(cleanName, ext);
  const safeBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60) || "document";

  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  return `${safeBase}_${uniqueSuffix}${ext}`;
}

/**
 * Validates a student assignment submission file:
 * - PDF only
 * - MIME validation (if provided)
 * - Size limit (25MB)
 * - Path traversal and executable blacklist
 */
export function validateStudentSubmission(
  fileName: string,
  mimeType?: string,
  fileSizeBytes?: number
): FileValidationResult {
  if (!fileName || typeof fileName !== "string" || !fileName.trim()) {
    return { valid: false, error: "Please select a valid PDF file to upload." };
  }

  // Path traversal check
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\") || fileName.includes("\0")) {
    return { valid: false, error: "Security violation: Invalid characters or path traversal sequence detected." };
  }

  const ext = path.extname(fileName.trim()).toLowerCase();

  // Executable check
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Security violation: Executable or script file type '${ext}' is strictly prohibited.` };
  }

  // PDF-only enforcement
  if (ext !== ".pdf") {
    return {
      valid: false,
      error: `Invalid file format '${ext}'. Official student assignment submissions must be in PDF format (.pdf) only.`,
    };
  }

  // MIME type validation
  if (mimeType && typeof mimeType === "string") {
    const cleanMime = mimeType.trim().toLowerCase();
    if (!STUDENT_ALLOWED_MIMES.includes(cleanMime) && cleanMime !== "application/octet-stream") {
      return {
        valid: false,
        error: `Invalid MIME type '${cleanMime}'. Only PDF documents (application/pdf) are accepted.`,
      };
    }
  }

  // Size limit check
  const size = typeof fileSizeBytes === "number" ? fileSizeBytes : 1024 * 1024;
  if (size <= 0) {
    return { valid: false, error: "Uploaded file is empty (0 bytes)." };
  }
  if (size > STUDENT_SUBMISSION_MAX_BYTES) {
    return {
      valid: false,
      error: `File size exceeds institutional limit of 25 MB. (Received: ${(size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return {
    valid: true,
    sanitizedFilename: sanitizeFilename(fileName),
    detectedType: "PDF",
    normalizedMime: "application/pdf",
  };
}

/**
 * Validates teacher reference resources:
 * - Allowed types: PDF, Images (JPG, PNG, WebP, GIF, SVG), Video (MP4, WebM, OGG, MOV, MKV)
 * - MIME validation (if provided)
 * - Size limit (100MB)
 * - Path traversal and executable blacklist
 */
export function validateTeacherResource(
  fileName: string,
  mimeType?: string,
  fileSizeBytes?: number
): FileValidationResult {
  if (!fileName || typeof fileName !== "string" || !fileName.trim()) {
    return { valid: false, error: "Please provide a valid coursework resource file." };
  }

  // Path traversal check
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\") || fileName.includes("\0")) {
    return { valid: false, error: "Security violation: Invalid characters or path traversal sequence detected." };
  }

  const ext = path.extname(fileName.trim()).toLowerCase();

  // Executable check
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Security violation: Executable or script file type '${ext}' is strictly prohibited.` };
  }

  // Detect resource category
  let detectedType: "PDF" | "IMAGE" | "VIDEO" | null = null;
  if (TEACHER_PDF_EXTENSIONS.includes(ext)) {
    detectedType = "PDF";
  } else if (TEACHER_IMAGE_EXTENSIONS.includes(ext)) {
    detectedType = "IMAGE";
  } else if (TEACHER_VIDEO_EXTENSIONS.includes(ext)) {
    detectedType = "VIDEO";
  }

  if (!detectedType) {
    return {
      valid: false,
      error: `Invalid file format '${ext}'. Permitted teacher resources: PDF (.pdf), Images (.jpg, .png, .webp, .svg, .gif), or Video (.mp4, .webm, .mov).`,
    };
  }

  // MIME check if provided
  if (mimeType && typeof mimeType === "string") {
    const cleanMime = mimeType.trim().toLowerCase();
    if (cleanMime !== "application/octet-stream" && !TEACHER_ALLOWED_MIMES.includes(cleanMime)) {
      return {
        valid: false,
        error: `MIME type '${cleanMime}' is not permitted for institutional resources.`,
      };
    }
  }

  // Size limit check
  const size = typeof fileSizeBytes === "number" ? fileSizeBytes : 1024 * 1024;
  if (size <= 0) {
    return { valid: false, error: "Resource file is empty (0 bytes)." };
  }
  if (size > TEACHER_RESOURCE_MAX_BYTES) {
    return {
      valid: false,
      error: `Resource file size exceeds institutional limit of 100 MB. (Received: ${(size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  let normalizedMime = "application/pdf";
  if (detectedType === "IMAGE") {
    normalizedMime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  } else if (detectedType === "VIDEO") {
    normalizedMime = ext === ".webm" ? "video/webm" : "video/mp4";
  }

  return {
    valid: true,
    sanitizedFilename: sanitizeFilename(fileName),
    detectedType,
    normalizedMime,
  };
}

// Backward-compatible generic wrapper
export function validateFileSecurity(
  fileName: string,
  fileSizeBytes: number,
  options: { maxSizeBytes?: number; allowedExtensions?: string[] } = {}
): { valid: boolean; error?: string } {
  const ext = path.extname(fileName || "").toLowerCase();
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Forbidden file extension '${ext}'.` };
  }
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return { valid: false, error: "Path traversal attempt detected." };
  }
  if (options.allowedExtensions && !options.allowedExtensions.includes(ext)) {
    return { valid: false, error: `File type '${ext}' is not permitted.` };
  }
  if (fileSizeBytes > (options.maxSizeBytes || STUDENT_SUBMISSION_MAX_BYTES)) {
    return { valid: false, error: "File exceeds size limit." };
  }
  return { valid: true };
}
