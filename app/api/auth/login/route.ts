import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signJwt } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password, loginId } = await req.json();
    const identifier = (loginId || email || "").trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Please provide your User ID or University Email and password." },
        { status: 400 }
      );
    }

    // Lookup by either institutional email or custom User ID (AT-STUDENT-001 / AT-TEACHER-001)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { customId: identifier.toUpperCase() },
        ],
      },
      include: {
        student: {
          include: {
            section: true,
          },
        },
        teacher: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid university credentials." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid university credentials." },
        { status: 401 }
      );
    }

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role as "STUDENT" | "TEACHER",
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        student: user.student
          ? {
              rollNumber: user.student.rollNumber,
              sectionName: user.student.section.name,
              semester: user.student.semester,
            }
          : null,
        teacher: user.teacher
          ? {
              employeeId: user.teacher.employeeId,
              department: user.teacher.department,
              designation: user.teacher.designation,
            }
          : null,
      },
      redirectUrl: user.role === "STUDENT" ? "/student" : "/teacher",
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "academic_track_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during authentication." },
      { status: 500 }
    );
  }
}
