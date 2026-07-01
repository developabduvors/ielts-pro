import "server-only";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, validateStudentDeviceSession, type StudentSession } from "@ielts-pro/shared";

const COOKIE_NAME = "ielts_student_session";

function secret() {
  return process.env.STUDENT_SESSION_SECRET || "dev-student-session-secret-change-me";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function setStudentSession(session: StudentSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const jar = await cookies();
  jar.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function getStudentSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StudentSession;
  } catch {
    return null;
  }
}

export async function requireStudentSession() {
  const session = await getStudentSession();
  if (!session) redirect("/");
  if (!session.device_session_id || !session.session_token) {
    await clearStudentSession();
    redirect("/?error=session-expired");
  }
  const requestHeaders = await headers();
  let valid = false;
  try {
    valid = await validateStudentDeviceSession(createServerSupabaseClient(), {
      studentId: session.id,
      deviceSessionId: session.device_session_id,
      sessionTokenHash: hashStudentSessionToken(session.session_token),
      userAgent: requestHeaders.get("user-agent")
    });
  } catch (error) {
    console.error("Student session validation failed", error);
    await clearStudentSession();
    redirect("/?error=access-setup");
  }
  if (!valid) {
    await clearStudentSession();
    redirect("/?error=session-revoked");
  }
  return session;
}

export async function clearStudentSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export function createStudentSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashStudentSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
