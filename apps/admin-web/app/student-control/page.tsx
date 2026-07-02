import { Badge, Button, Card, StatCard, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAllStudents, getStudentDeviceSessions, getWritingSubmissions } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../components/AdminShell";
import { revokeAllDevicesAction, toggleStudentAccessAction } from "../actions/lms";

export default async function StudentControlPage() {
  const admin = await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const [students, submissions] = await Promise.all([
    getAllStudents(supabase),
    getWritingSubmissions(supabase)
  ]);
  let sessions: Awaited<ReturnType<typeof getStudentDeviceSessions>> = [];
  try {
    sessions = await getStudentDeviceSessions(supabase);
  } catch (error) {
    console.error("Student device sessions unavailable", error);
  }

  const submissionsByStudent = new Map<string, typeof submissions>();
  submissions.forEach((submission) => {
    submissionsByStudent.set(submission.student_id, [...(submissionsByStudent.get(submission.student_id) || []), submission]);
  });

  const sessionsByStudent = new Map<string, typeof sessions>();
  sessions.forEach((session) => {
    sessionsByStudent.set(session.student_id, [...(sessionsByStudent.get(session.student_id) || []), session]);
  });

  const activeStudents = students.filter((student) => (submissionsByStudent.get(student.id)?.length || 0) > 0).length;
  const improvingStudents = students.filter((student) => progressTrend(submissionsByStudent.get(student.id) || []) === "up").length;
  const stuckStudents = students.filter((student) => progressTrend(submissionsByStudent.get(student.id) || []) === "down").length;
  const activeDevices = sessions.filter((session) => session.is_active !== false && !session.revoked_at).length;

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero">
        <div>
          <p className="eyebrow">Student control</p>
          <h1>Track who is working and who needs help.</h1>
          <p className="muted">See access activity, test attempts, review coverage, progress direction, and device sessions from one control surface.</p>
        </div>
      </div>

      <section className="stats-grid student-ops-stats" aria-label="Student activity summary">
        <StatCard label="Active learners" value={activeStudents} note="students with attempts" />
        <StatCard label="Improving" value={improvingStudents} note="latest score moved up" />
        <StatCard label="Needs attention" value={stuckStudents} note="latest score moved down" />
        <StatCard label="Active devices" value={activeDevices} note="current open sessions" />
      </section>

      <Card className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Control table</p>
            <h2>Student progress tracker</h2>
            <p className="muted">“Time” is estimated from device session first/last seen until a dedicated activity-events table is added.</p>
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Activity</th>
              <th>Tests</th>
              <th>Progress</th>
              <th>Latest work</th>
              <th>Access</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const studentSubmissions = submissionsByStudent.get(student.id) || [];
              const studentSessions = sessionsByStudent.get(student.id) || [];
              const latest = studentSubmissions[0];
              const trend = progressTrend(studentSubmissions);
              const reviewed = studentSubmissions.filter((submission) => submission.score != null).length;
              const open = student.is_active !== false && student.access_status !== "closed";
              return (
                <tr key={student.id}>
                  <td>
                    <strong>{student.name}</strong>
                    <p className="table-note">{student.groups?.name || "No group"} · ID {student.student_code}</p>
                  </td>
                  <td>
                    <strong>{formatActivityWindow(studentSessions)}</strong>
                    <p className="table-note">Last login {formatDate(student.last_login_at)}</p>
                  </td>
                  <td>
                    <strong>{studentSubmissions.length}</strong>
                    <p className="table-note">{reviewed} reviewed · {studentSubmissions.length - reviewed} pending</p>
                  </td>
                  <td>
                    <Badge tone={trend === "up" ? "success" : trend === "down" ? "warning" : "neutral"}>
                      {trend === "up" ? "Going up" : trend === "down" ? "Dropping" : "No trend yet"}
                    </Badge>
                    <p className="table-note">{scoreLine(studentSubmissions)}</p>
                  </td>
                  <td>
                    <strong>{latest?.tasks?.title || "No attempts yet"}</strong>
                    <p className="table-note">{latest ? `${latest.tasks?.skill || "task"} · ${formatDate(latest.submitted_at)}` : "Assign a test or lesson"}</p>
                  </td>
                  <td>
                    <Badge tone={open ? "success" : "warning"}>
                      {open ? "Open" : "Closed"}
                    </Badge>
                    <p className="table-note">{studentSessions.filter((session) => session.is_active !== false && !session.revoked_at).length} active device(s)</p>
                  </td>
                  <td>
                    <div className="table-actions">
                      <form action={toggleStudentAccessAction}>
                        <input type="hidden" name="student_id" value={student.id} />
                        <input type="hidden" name="open" value={String(!open)} />
                        <Button variant={open ? "danger" : "secondary"}>{open ? "Close access" : "Open access"}</Button>
                      </form>
                      <form action={revokeAllDevicesAction}>
                        <input type="hidden" name="student_id" value={student.id} />
                        <Button variant="secondary">Revoke devices</Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </AdminShell>
  );
}

function progressTrend(submissions: Array<{ score: number | null; submitted_at: string }>) {
  const scored = submissions
    .filter((submission) => submission.score != null)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  if (scored.length < 2) return "flat";
  const latest = scored[0].score || 0;
  const previous = scored[1].score || 0;
  if (latest > previous) return "up";
  if (latest < previous) return "down";
  return "flat";
}

function scoreLine(submissions: Array<{ score: number | null; total: number | null; submitted_at: string }>) {
  const scored = submissions
    .filter((submission) => submission.score != null)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  if (!scored.length) return "No reviewed score yet";
  const latest = scored[0];
  return `Latest ${latest.score}/${latest.total ?? "band"}`;
}

function formatActivityWindow(sessions: Array<{ created_at: string; last_seen_at: string; revoked_at: string | null }>) {
  if (!sessions.length) return "No tracked session";
  const first = Math.min(...sessions.map((session) => new Date(session.created_at).getTime()));
  const last = Math.max(...sessions.map((session) => new Date(session.last_seen_at || session.created_at).getTime()));
  const minutes = Math.max(0, Math.round((last - first) / 60000));
  if (minutes < 1) return "Just started";
  if (minutes < 60) return `${minutes} min tracked`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${rest}m tracked`;
}

function formatDate(value?: string | null) {
  if (!value) return "never";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
