import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  // Strict backend role authorization
  if (user.role !== "TEACHER") {
    redirect("/student");
  }

  const designation = user.teacher?.designation || "Faculty Member";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header
        user={{
          name: user.name,
          email: user.email,
          role: "TEACHER",
        }}
      />
      <div className="flex-1 flex">
        <Sidebar role="TEACHER" />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
