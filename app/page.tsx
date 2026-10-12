import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "STUDENT") {
    redirect("/student");
  } else if (user.role === "TEACHER") {
    redirect("/teacher");
  }

  redirect("/login");
}
