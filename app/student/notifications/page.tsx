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
  Calendar,
  ArrowRight,
  ShieldCheck,
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/student/notifications");
      if (!res.ok) throw new Error("Could not retrieve notifications.");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-3 border-[#0F2848] border-t-[#D97706] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-600">Retrieving Academic Alerts...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#0F172A]">
          Notifications
        </h1>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-[#15193B] hover:text-indigo-600 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Mark All Read
            </button>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {unreadCount} Unread
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500 text-xs">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="font-semibold text-slate-700 text-sm">No notifications found</span>
            <p className="mt-1">You have no new academic alerts at this time.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read;

            return (
              <div
                key={n.id}
                className={`p-4 rounded-lg border transition-all flex items-start justify-between gap-4 ${
                  isUnread
                    ? "bg-white border-[#C4D7EB] shadow-sm"
                    : "bg-slate-50/70 border-slate-200 text-slate-600"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon per type */}
                  <div className="mt-0.5 flex-shrink-0">
                    {n.type === "NEW_ASSIGNMENT" && (
                      <div className="w-8 h-8 rounded bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                    )}
                    {n.type === "DEADLINE_APPROACHING" && (
                      <div className="w-8 h-8 rounded bg-amber-100 text-amber-900 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    )}
                    {n.type === "DEADLINE_PASSED" && (
                      <div className="w-8 h-8 rounded bg-red-100 text-red-800 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    {n.type === "SUBMISSION_VERIFIED" && (
                      <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                    )}
                    {n.type === "QUERY_ANSWERED" && (
                      <div className="w-8 h-8 rounded bg-purple-100 text-purple-800 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`text-xs sm:text-sm font-heading font-bold ${
                          isUnread ? "text-[#0F2848]" : "text-slate-800"
                        }`}
                      >
                        {n.title}
                      </h3>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <div className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {n.link && (
                  <Link
                    href={n.link}
                    className="flex-shrink-0 px-3 py-1.5 bg-[#0F2848] hover:bg-[#143763] text-white rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3 text-[#FBBF24]" />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
