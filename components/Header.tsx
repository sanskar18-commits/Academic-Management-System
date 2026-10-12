"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Bell, LogOut, Key } from "lucide-react";
import NotificationPanel from "./NotificationPanel";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: "STUDENT" | "TEACHER";
    avatar?: string | null;
    extraInfo?: string;
    studentInfo?: {
      roll?: string;
      section?: string;
      semester?: number;
    };
  };
  sectionName?: string;
}

export default function Header({ user, sectionName }: HeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const isStudent = user.role === "STUDENT";
  const userInitial = user.name ? user.name.trim().charAt(0).toUpperCase() : (isStudent ? "S" : "F");

  // Format pills for profile dropdown as shown in reference design
  const roll = user.studentInfo?.roll || (isStudent ? "2105794" : undefined);
  const sec = user.studentInfo?.section || (isStudent ? (sectionName || "SEC-G3") : undefined);
  const sem = user.studentInfo?.semester ? `Sem ${user.studentInfo.semester}` : (isStudent ? "Sem 3" : undefined);

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Modern Project Brand */}
        <div className="flex items-center space-x-3">
          <Link
            href={isStudent ? "/student" : "/teacher"}
            className="flex items-center space-x-3 group"
          >
            {/* Sleek Minimal Monogram Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#15193B] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-[#1e2352] transition-colors">
              <span className="tracking-tighter">AT</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-heading font-extrabold text-base sm:text-lg text-[#0F172A] tracking-tight">
                AcademicTrack
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide ${
                  isStudent
                    ? "bg-amber-50 text-amber-900 border border-amber-200/80"
                    : "bg-blue-50 text-blue-900 border border-blue-200/80"
                }`}
              >
                {isStudent ? "STUDENT" : "FACULTY"}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Side: Cohort (for student only), Globe, Notifications, User Initial Avatar */}
        <div className="flex items-center space-x-3 sm:space-x-3.5">
          {isStudent && sectionName && (
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium">Cohort:</span>
              <span className="font-bold text-[#0F172A]">{sectionName}</span>
            </div>
          )}

          {/* Notifications Panel */}
          <NotificationPanel isStudent={isStudent} />

          {/* User Initial Avatar Button (Clean Letter Avatar Only) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              title={`${user.name} (${user.role})`}
              className="w-9 h-9 rounded-full bg-[#F59E0B] text-white font-bold flex items-center justify-center text-sm shadow-xs hover:ring-2 hover:ring-[#F59E0B]/50 transition-all cursor-pointer"
            >
              <span>{userInitial}</span>
            </button>

            {/* Profile Dropdown matching User Reference Layout */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-1">
                {/* User Identification Header */}
                <div className="px-4 pb-3">
                  <div className="font-bold text-sm text-[#0F172A] tracking-tight uppercase truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{user.email}</div>

                  {/* Reference Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {isStudent ? (
                      <>
                        {roll && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800">
                            Roll: {roll.replace(/^[A-Z]+\/\d+\/[A-Z]+\//, "")}
                          </span>
                        )}
                        {sec && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-800">
                            Sec: {sec.replace(/^BCA - /, "")}
                          </span>
                        )}
                        {sem && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                            {sem}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800">
                          Faculty
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-800">
                          Computer Applications
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 my-1"></div>

                {/* Change Password Navigation Link (Redirects to Page) */}
                <Link
                  href={isStudent ? "/student/change-password" : "/teacher/change-password"}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Key className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Change Password</span>
                </Link>

                {/* Logout Action */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-[#EF4444] hover:bg-red-50/50 transition-colors text-left cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-[#EF4444]" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
