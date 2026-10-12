"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  AlertTriangle,
} from "lucide-react";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  customId: string;
  rollNumber: string;
  semester: number;
  admissionYear: number;
  status: string;
  section: {
    id: string;
    name: string;
    program: string;
    batch: string;
  };
  stats: {
    enrolledCourses: number;
    totalSubmissions: number;
    academicStanding: string;
  };
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/student/profile");
        if (!res.ok) throw new Error("Could not load profile.");
        const data = await res.json();
        setProfile(data.profile);
      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading Profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-red-900 text-sm">Failed to Load Profile</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  const initial = profile.name ? profile.name.trim().charAt(0).toUpperCase() : "S";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Clean Header */}
      <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
        Student Profile
      </h1>

      {/* Main Profile Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Initial Letter Avatar (No profile picture) */}
          <div className="w-16 h-16 rounded-2xl bg-[#F59E0B] text-white font-bold flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
            {initial}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <h2 className="text-xl font-heading font-bold text-[#0F172A]">
              {profile.name}
            </h2>
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span>{profile.email}</span>
            </div>

            {/* Reference Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800">
                Roll: {profile.rollNumber.replace(/^[A-Z]+\/\d+\/[A-Z]+\//, "")}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-800">
                Sec: {profile.section.name.replace(/^BCA - /, "")}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                Sem {profile.semester}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[11px] text-slate-400">Student ID</div>
            <div className="font-semibold text-slate-800 mt-0.5">{profile.customId}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[11px] text-slate-400">Program</div>
            <div className="font-semibold text-slate-800 mt-0.5">{profile.section.program}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[11px] text-slate-400">Admission Year</div>
            <div className="font-semibold text-slate-800 mt-0.5">{profile.admissionYear}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
