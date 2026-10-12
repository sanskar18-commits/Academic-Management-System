import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  // Strict backend role authorization
  if (user.role !== "STUDENT") {
    redirect("/teacher");
  }

  const rawSectionName = user.student?.section.name || "BCA - SEC-G3";
  // Format from "BCA - SEC-G3" to "BCA / G3"
  const sectionName = rawSectionName.replace(" - SEC-", " / ").replace(" - ", " / ");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header
        user={{
          name: user.name,
          email: user.email,
          role: "STUDENT",
          studentInfo: {
            roll: user.student?.rollNumber,
            section: sectionName,
            semester: user.student?.semester,
          },
        }}
        sectionName={sectionName}
      />
      <div className="flex-1 flex">
        <Sidebar role="STUDENT" sectionName={sectionName} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
