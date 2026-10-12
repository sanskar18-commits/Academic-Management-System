"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck2,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "NEW_ASSIGNMENT" | "DEADLINE_APPROACHING" | "DEADLINE_PASSED" | "SUBMISSION_VERIFIED" | "QUERY_ANSWERED";
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationPanel({ isStudent }: { isStudent: boolean }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!isStudent) return;
    setLoading(true);
    try {
      const res = await fetch("/api/student/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const markAllRead = async () => {
    try {
      await fetch("/api/student/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // We fetch initially to get unread count
  useEffect(() => {
    if (isStudent) {
      loadNotifications();
    }
  }, [isStudent]);

  if (!isStudent) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center relative text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 flex flex-col animate-in fade-in slide-in-from-top-1">
          <div className="px-4 pb-2 flex justify-between items-center border-b border-slate-100">
            <span className="font-bold text-sm text-[#0F172A]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#15193B] hover:text-indigo-600 font-semibold cursor-pointer"
              >
                Clear Notifications
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <span className="font-semibold text-slate-700">No notifications</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border flex items-start space-x-3 transition-colors ${
                    !n.read ? "bg-slate-50 border-slate-200" : "bg-white border-transparent"
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${!n.read ? "text-[#0F172A]" : "text-slate-700"}`}>
                        {n.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{n.message}</p>
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center space-x-1 mt-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
