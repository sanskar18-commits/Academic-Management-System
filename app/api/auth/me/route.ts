import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        student: user.student
          ? {
              id: user.student.id,
              rollNumber: user.student.rollNumber,
              sectionName: user.student.section.name,
              semester: user.student.semester,
            }
          : null,
        teacher: user.teacher
          ? {
              id: user.teacher.id,
              employeeId: user.teacher.employeeId,
              department: user.teacher.department,
              designation: user.teacher.designation,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
