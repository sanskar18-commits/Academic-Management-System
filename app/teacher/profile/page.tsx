"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Building,
  MapPin,
  Check,
  Edit2,
  X,
  BookOpen,
  Layers,
  Award,
} from "lucide-react";

interface FacultyProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  cabinLocation: string;
  academicYear: string;
  status: string;
  allocatedSubjects: Array<{
    code: string;
    name: string;
    credits: number;
    sectionName: string;
    isLab: boolean;
  }>;
  stats: {
    coursesCount: number;
    activeAssignments: number;
    verifiedSubmissions: number;
  };
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Location edit state
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/teacher/profile");
        if (!res.ok) throw new Error("Failed to load faculty profile.");
        const data = await res.json();
        setProfile(data.profile);
        setLocationValue(data.profile.cabinLocation || "Faculty Cabin 204");
      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationValue.trim()) return;

    setSavingLocation(true);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cabinLocation: locationValue.trim() }),
      });
      if (res.ok) {
        if (profile) {
          setProfile({ ...profile, cabinLocation: locationValue.trim() });
        }
        setEditingLocation(false);
      }
    } catch (err) {
      console.error("Location update failed:", err);
    } finally {
      setSavingLocation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800 text-sm">
        {error || "Could not retrieve profile."}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-[#15193B] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Letter Avatar (No image) */}
          <div className="w-16 h-16 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-inner">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1 flex-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold">{profile.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>{profile.designation}</span>
              <span>•</span>
              <span>{profile.department}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Allocated Courses</div>
          <div className="text-2xl font-bold text-[#0F172A] mt-1">{profile.stats.coursesCount}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Active Coursework</div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">{profile.stats.activeAssignments}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Evaluated Submissions</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{profile.stats.verifiedSubmissions}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Faculty Details & Location Updater */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-heading font-bold text-[#0F172A]">
              Faculty Information
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Email</span>
                <span className="font-semibold text-slate-800">{profile.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Department</span>
                <span className="font-semibold text-slate-800">{profile.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Rank</span>
                <span className="font-semibold text-slate-800">{profile.designation}</span>
              </div>

              {/* Dynamic Location (Requirement 15) */}
              <div className="pt-1">
                <span className="text-slate-400 block text-[11px]">Current Location / Cabin</span>
                {!editingLocation ? (
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                      {profile.cabinLocation}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingLocation(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveLocation} className="mt-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      value={locationValue}
                      onChange={(e) => setLocationValue(e.target.value)}
                      className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg flex-1"
                    />
                    <button
                      type="submit"
                      disabled={savingLocation}
                      className="p-1 bg-[#15193B] text-white rounded-lg cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLocation(false)}
                      className="p-1 text-slate-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Allocated Courses across Departments & Sections */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-heading font-bold text-[#0F172A]">
                Allocated Courses &amp; Sections
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {profile.allocatedSubjects.length} Courses
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {profile.allocatedSubjects.map((sub, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">
                      <span className="font-mono text-[#15193B] mr-2">[{sub.code}]</span>
                      {sub.name}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Section: {sub.sectionName} • {sub.credits} Credits • {sub.isLab ? "Lab" : "Theory"}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {sub.sectionName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
