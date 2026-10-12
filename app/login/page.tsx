"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both ID/Email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check credentials.");
        setLoading(false);
        return;
      }

      router.push(data.redirectUrl || "/");
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please ensure the server is active.");
      setLoading(false);
    }
  };

  const fillDemo = (demoRole: "STUDENT" | "TEACHER") => {
    setRole(demoRole);
    if (demoRole === "STUDENT") {
      setEmail("AT-STUDENT-001");
      setPassword("Student@123");
    } else {
      setEmail("AT-TEACHER-001");
      setPassword("Teacher@123");
    }
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container Box */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Side: Brand Narrative & Identity */}
        <div className="lg:col-span-5 bg-[#15193B] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white text-base shadow-inner">
                AT
              </div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                AcademicTrack
              </span>
            </div>

            <div className="pt-6 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight leading-snug">
                Streamlined academic progress &amp; mentorship.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                A unified platform for students and faculty to track coursework, manage evaluations, and collaborate with mentors seamlessly.
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 pt-8 text-[11px] text-slate-400/80">
            Academic Management System
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-heading font-bold text-[#0F172A] tracking-tight">
                Sign In
              </h1>
            </div>

            {/* Role Switcher Pill */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setRole("STUDENT");
                  setEmail("");
                  setPassword("");
                  setErrorMessage("");
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  role === "STUDENT"
                    ? "bg-white text-[#0F172A] shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <GraduationCap className="w-4 h-4 text-amber-500" />
                <span>Student Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("TEACHER");
                  setEmail("");
                  setPassword("");
                  setErrorMessage("");
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  role === "TEACHER"
                    ? "bg-white text-[#0F172A] shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Faculty Portal</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {role === "STUDENT" ? "Student ID or Email" : "Faculty ID or Email"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === "STUDENT" ? "e.g. AT-STUDENT-001 or student@domain.com" : "e.g. AT-TEACHER-001 or faculty@domain.com"
                    }
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#15193B] text-slate-900 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#15193B] text-slate-900 font-medium placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#15193B] hover:bg-[#1e2352] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
                <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
              </button>
            </form>

            {/* Quick Demo Login Buttons */}
            <div className="pt-2">
              <div className="text-[11px] font-medium text-slate-400 text-center mb-2">
                Quick 1-Click Demo Accounts
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("STUDENT")}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Student Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo("TEACHER")}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Faculty Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
