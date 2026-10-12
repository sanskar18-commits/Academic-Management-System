import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "academic_track_fallback_secret_institutional_key";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  name: string;
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/**
 * Server-side authentication helper.
 * Validates token from HTTP-only cookie or Authorization header,
 * and verifies that user exists in database with matching role.
 */
export async function getAuthenticatedUser(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.get("academic_track_token")?.value;
    }
  } else {
    const cookieStore = cookies();
    token = cookieStore.get("academic_track_token")?.value;
  }

  if (!token) {
    return null;
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
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
    return null;
  }

  // Security check: ensure DB role matches token role
  if (user.role !== payload.role) {
    return null;
  }

  return user;
}
