import Link from "next/link";
import { createServerSupabaseClient, getStudentDeviceSessions, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import { feedbackSubmissions, formatDate, reviewedSubmissions, scoreLabel } from "../student-utils";

export default async function ProfilePage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const submissions = await getStudentSubmissions(supabase, session.id);
  let deviceSessions: Awaited<ReturnType<typeof getStudentDeviceSessions>> = [];
  let deviceTrackingNote = "";
  try {
    deviceSessions = await getStudentDeviceSessions(supabase, session.id);
  } catch (error) {
    console.error("Student profile device sessions unavailable", error);
    deviceTrackingNote = "Device tracking is being configured. Practice, results, and feedback still work.";
  }
  const reviewed = reviewedSubmissions(submissions);
  const feedback = feedbackSubmissions(submissions);
  const activeDevices = deviceSessions.filter((device) => device.is_active !== false && !device.revoked_at);

  return (
    <StudentShell
      name={session.name}
      sectionLabel="Profile"
      sectionDescription="Access ID, recent work, and active devices"
    >
      <main className="student-page student-profile-page">
        <section className="student-hero-panel">
          <div>
            <p className="student-kicker">Student profile</p>
            <h1>{session.name}</h1>
              <p>Your teacher-issued access ID is active.</p>
            <div className="student-action-row">
              <Link className="student-primary-button" href="/practice">Continue practice</Link>
              <Link className="student-secondary-button" href="/results">View results</Link>
            </div>
          </div>
          <div className="student-access-card">
            <span>Student Access ID</span>
            <strong>{maskAccessId(session.student_code)}</strong>
            <small>Never share this code publicly.</small>
          </div>
        </section>

        <section className="student-stat-grid" aria-label="Profile summary">
          <MetricCard label="Attempts" value={submissions.length} note="submitted tasks" />
          <MetricCard label="Reviewed" value={reviewed.length} note="scored attempts" />
          <MetricCard label="Feedback" value={feedback.length} note="teacher notes" />
          <MetricCard label="Devices" value={activeDevices.length} note="active sessions" />
        </section>

        <section className="student-two-column">
          <article className="student-panel">
            <div className="student-section-header">
              <div>
                <p className="student-kicker">Recent results</p>
                <h2>Latest submissions</h2>
              </div>
              <Link href="/results">All history</Link>
            </div>
            <div className="student-card-list">
              {submissions.slice(0, 5).map((submission) => (
                <article className="student-result-row" key={submission.id}>
                  <span className="student-skill-icon tone-reading">{submission.tasks?.title?.slice(0, 1) || "T"}</span>
                  <div>
                    <strong>{submission.tasks?.title || "Practice task"}</strong>
                    <small>{formatDate(submission.submitted_at, { dateStyle: "medium", timeStyle: "short" })}</small>
                    {submission.feedback ? <p>{submission.feedback}</p> : null}
                  </div>
                  <em>{scoreLabel(submission)}</em>
                </article>
              ))}
              {!submissions.length ? (
                <div className="student-empty-card">
                  <h3>No attempts yet</h3>
                  <p>Start practice to build your result history.</p>
                  <Link className="student-secondary-button" href="/practice">Open practice</Link>
                </div>
              ) : null}
            </div>
          </article>

          <aside className="student-panel">
            <div className="student-section-header">
              <div>
                <p className="student-kicker">Access safety</p>
                <h2>Device sessions</h2>
              </div>
            </div>
            {deviceTrackingNote ? <p className="student-warning-note">{deviceTrackingNote}</p> : null}
            <div className="student-card-list">
              {deviceSessions.slice(0, 5).map((device) => {
                const active = device.is_active !== false && !device.revoked_at;
                return (
                  <article className="student-device-card" key={device.id}>
                    <span className={`student-status-pill ${active ? "is-done" : ""}`}>{active ? "Active" : "Revoked"}</span>
                    <strong>{shortUserAgent(device.user_agent)}</strong>
                    <small>Last seen {formatDate(device.last_seen_at, { dateStyle: "medium", timeStyle: "short" })}</small>
                  </article>
                );
              })}
              {!deviceSessions.length && !deviceTrackingNote ? (
                <div className="student-empty-card">
                  <h3>No tracked devices yet</h3>
                  <p>Your current browser session will appear here after the next access check.</p>
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      </main>
    </StudentShell>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <article className="student-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function maskAccessId(value: string) {
  if (value.length <= 3) return "***";
  return `${value.slice(0, 2)}${"*".repeat(Math.max(value.length - 4, 2))}${value.slice(-2)}`;
}

function shortUserAgent(userAgent?: string | null) {
  if (!userAgent) return "Unknown browser";
  if (userAgent.includes("Chrome")) return "Chrome browser";
  if (userAgent.includes("Safari")) return "Safari browser";
  if (userAgent.includes("Firefox")) return "Firefox browser";
  return userAgent.slice(0, 42);
}
