import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { StudentSession } from "@ielts-pro/shared";

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
  return session;
}

export async function clearStudentSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
