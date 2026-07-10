import "server-only";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, validateStudentDeviceSession, type AdminSession, type StudentSession } from "@ielts-pro/shared";
import { getAdminSession } from "@/lib/admin-session";

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
  if (!session) {
    // Admins can open student pages directly (preview) without a student login.
    const admin = await getAdminSession();
    if (admin) return adminPreviewSession(admin);
    redirect("/login");
  }
  if (!session.device_session_id || !session.session_token) {
    return session;
  }
  if (session.device_session_id === "legacy" && session.session_token === "legacy") {
    return session;
  }

  // The device-session check only refreshes last_seen for the admin devices
  // list. It never blocks: anyone with a validly signed cookie stays logged in.
  // Access status and device limits are enforced at login time instead.
  const tokenHash = hashStudentSessionToken(session.session_token);
  const cacheKey = `${session.id}:${session.device_session_id}:${tokenHash}`;
  if (isRecentlyValidated(cacheKey)) {
    return session;
  }

  const requestHeaders = await headers();
  try {
    const valid = await validateStudentDeviceSession(createServerSupabaseClient(), {
      studentId: session.id,
      deviceSessionId: session.device_session_id,
      sessionTokenHash: tokenHash,
      userAgent: requestHeaders.get("user-agent")
    });
    if (valid) rememberValidated(cacheKey);
    else validatedSessions.delete(cacheKey);
  } catch (error) {
    console.error("Student session validation failed", error);
  }
  return session;
}

// Sentinel student id for admins previewing student pages: a valid UUID that
// never matches a real student row, so lookups return empty data instead of
// throwing on uuid parsing.
const ADMIN_PREVIEW_STUDENT_ID = "00000000-0000-0000-0000-000000000000";

function adminPreviewSession(admin: AdminSession): StudentSession {
  return {
    id: ADMIN_PREVIEW_STUDENT_ID,
    name: admin.email.split("@")[0] || "Teacher",
    student_code: "admin-preview",
    group_id: null,
    device_session_id: "legacy",
    session_token: "legacy"
  };
}

// Short-lived cache of device-session validations, keyed by student + device +
// token hash. Bounds memory by dropping expired entries opportunistically.
const VALIDATION_TTL_MS = 60_000;
const validatedSessions = new Map<string, number>();

function isRecentlyValidated(key: string) {
  const until = validatedSessions.get(key);
  if (!until) return false;
  if (until <= Date.now()) {
    validatedSessions.delete(key);
    return false;
  }
  return true;
}

function rememberValidated(key: string) {
  validatedSessions.set(key, Date.now() + VALIDATION_TTL_MS);
  if (validatedSessions.size > 5000) {
    const now = Date.now();
    for (const [k, v] of validatedSessions) {
      if (v <= now) validatedSessions.delete(k);
    }
  }
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
