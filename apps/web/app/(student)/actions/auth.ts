"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient, createStudentDeviceSession, getOpenStudentByAccessId, getStudentDeviceSessions, touchStudentLogin } from "@ielts-pro/shared";
import { clearStudentSession, createStudentSessionToken, hashStudentSessionToken, setStudentSession } from "@/lib/session";

export async function studentLogin(_: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  if (!name || !code) return { error: "Enter your full name and Student Access ID." };

  try {
    const supabase = createServerSupabaseClient();
    const token = createStudentSessionToken();
    const requestHeaders = await headers();
    const userAgent = requestHeaders.get("user-agent");

    // Fast path: one round-trip does lookup + status + device-limit + session
    // insert + last_login. Each DB round-trip costs ~1s, so collapsing 3 calls
    // into 1 is the main win. Falls back below if the RPC is not deployed yet.
    const rpc = await tryStudentLoginRpc(supabase, {
      name,
      code,
      sessionTokenHash: hashStudentSessionToken(token),
      userAgent
    });
    if (rpc) {
      if (rpc.outcome === "closed") return { error: "This Student Access ID is closed. Contact your teacher." };
      if (rpc.outcome === "device_limit") return { error: "This Student Access ID has reached its device limit. Ask your teacher to revoke an old device." };
      if (rpc.outcome !== "ok" || !rpc.student) return { error: "Student was not found. Check the name and access ID from your teacher." };
      await setStudentSession({
        id: rpc.student.id,
        name: rpc.student.name,
        student_code: rpc.student.student_code,
        group_id: rpc.student.group_id,
        device_session_id: rpc.device_session_id || "legacy",
        session_token: token
      });
      redirect("/dashboard");
    }

    // Fallback path (RPC not present): keep the resilient multi-call flow.
    const { student, reason } = await getOpenStudentByAccessId(supabase, name, code);
    if (!student && reason === "closed") return { error: "This Student Access ID is closed. Contact your teacher." };
    if (!student) return { error: "Student was not found. Check the name and access ID from your teacher." };

    // last_login update is non-critical — kick it off now so it overlaps with the
    // device-session round-trips instead of adding another sequential hop.
    const touchPromise = touchStudentLogin(supabase, student.id).catch((error) => {
      console.warn("Could not update student last login", error);
    });

    let deviceSessionId = "legacy";
    let sessionToken = "legacy";
    try {
      if (student.max_devices && student.max_devices > 0) {
        const activeSessions = (await getStudentDeviceSessions(supabase, student.id)).filter((session) => session.is_active !== false && !session.revoked_at);
        if (activeSessions.length >= student.max_devices) {
          await touchPromise;
          return { error: "This Student Access ID has reached its device limit. Ask your teacher to revoke an old device." };
        }
      }

      const deviceSession = await createStudentDeviceSession(supabase, {
        studentId: student.id,
        sessionTokenHash: hashStudentSessionToken(token),
        userAgent,
        deviceLabel: "Student browser"
      });
      deviceSessionId = deviceSession.id;
      sessionToken = token;
    } catch (error) {
      if (!isMissingDeviceSessionsError(error)) throw error;
      console.warn("Student device sessions unavailable; using signed legacy session", error);
    }

    // Ensure the fire-and-forget update settles before the serverless function freezes.
    await touchPromise;

    await setStudentSession({
      id: student.id,
      name: student.name,
      student_code: student.student_code,
      group_id: student.group_id,
      device_session_id: deviceSessionId,
      session_token: sessionToken
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Student login failed", error);
    return { error: "Login is temporarily unavailable. Try again or contact your teacher." };
  }

  redirect("/dashboard");
}

type StudentLoginRpcResult = {
  outcome: "ok" | "not_found" | "closed" | "device_limit";
  device_session_id?: string;
  student?: { id: string; name: string; student_code: string; group_id: string | null };
};

// Returns the RPC result, or null when the function is not deployed so the
// caller can fall back to the legacy multi-call login path.
async function tryStudentLoginRpc(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  input: { name: string; code: string; sessionTokenHash: string; userAgent: string | null }
): Promise<StudentLoginRpcResult | null> {
  const { data, error } = await supabase.rpc("student_login", {
    p_name: input.name,
    p_code: input.code,
    p_session_token_hash: input.sessionTokenHash,
    p_user_agent: input.userAgent,
    p_device_label: "Student browser"
  });
  if (error) {
    if (isMissingRpcError(error)) return null;
    throw error;
  }
  return (data as StudentLoginRpcResult) || null;
}

function isMissingRpcError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return (
    code === "42883" || // undefined_function
    code === "42501" || // insufficient grant — treat as "not available", use fallback
    code === "PGRST202" || // PostgREST: function not found in schema cache
    message.includes("student_login") ||
    message.includes("Could not find the function") ||
    message.includes("schema cache")
  );
}

// next/navigation redirect() signals via a thrown error; never swallow it.
function isRedirectError(error: unknown) {
  return typeof (error as { digest?: string })?.digest === "string" && (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");
}

export async function studentLogout() {
  await clearStudentSession();
  redirect("/login");
}

function isMissingDeviceSessionsError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("student_device_sessions") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("access_status") ||
    message.includes("is_active")
  );
}
