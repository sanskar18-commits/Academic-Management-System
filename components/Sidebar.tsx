"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  HelpCircle,
  User,
  LogOut,
  ListOrdered,
  FileCheck2,
} from "lucide-react";

interface SidebarProps {
  role: "STUDENT" | "TEACHER";
  sectionName?: string;
  unreadNotifications?: number;
}

interface SidebarLink {
  name: string;
  href: string;
  icon: any;
  badge?: number | string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const isStudent = role === "STUDENT";

  const studentLinks: SidebarLink[] = [
    { name: "Dashboard", href: "/student", icon: LayoutDashboard },
    { name: "Enrolled Subjects", href: "/student/subjects", icon: BookOpen },
    { name: "Assignments & Tasks", href: "/student/assignments", icon: Layers },
    { name: "Ask Teacher", href: "/student/queries", icon: HelpCircle },
  ];

  const teacherLinks: SidebarLink[] = [
    { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { name: "Allocated Subjects", href: "/teacher/subjects", icon: BookOpen },
    { name: "Manage Assignments", href: "/teacher/assignments", icon: Layers },
    { name: "Create Assignment", href: "/teacher/assignments/create", icon: ListOrdered },
    { name: "Student Submissions", href: "/teacher/submissions", icon: FileCheck2 },
    { name: "Student Inquiries", href: "/teacher/queries", icon: HelpCircle },
  ];

  const links: SidebarLink[] = isStudent ? studentLinks : teacherLinks;

  return (
    <aside className="w-60 bg-[#15193B] text-slate-300 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0 select-none">
      <div className="py-4 px-3 space-y-4 overflow-y-auto">
        {/* Navigation List */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400/80 px-3 pb-2 pt-1">
            Navigation
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white/15 text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-[#F59E0B]" : "text-slate-400 group-hover:text-white"
                      }`}
                    />
                    <span>{link.name}</span>
                  </div>

                  {link.badge && (
                    <span className="text-[10px] font-bold bg-[#F59E0B] text-white px-1.5 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sign Out Action & Subtle App Version */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#EF4444] hover:text-red-300 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#EF4444]" />
          <span>Sign Out</span>
        </button>

        <div className="px-2 py-1 text-[10px] text-slate-400/80 flex items-center justify-between">
          <span>AcademicTrack</span>
          <span className="font-mono text-slate-400/70">v2.0</span>
        </div>
      </div>
    </aside>
  );
}
