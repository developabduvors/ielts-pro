import { Badge, Button, Card, EmptyState, Input, Select, StatCard, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAllGroups, getAllStudents, getStudentDeviceSessions, getWritingSubmissions } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/admin-session";
import { createStudentAccessAction, revokeAllDevicesAction, revokeDeviceSessionAction, toggleStudentAccessAction, updateStudentGroupAction } from "../actions/lms";
import { AdminShell } from "../components/AdminShell";
import { CopyButton } from "../components/CopyButton";

export default async function StudentsPage() {
  const admin = await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const [groups, students, submissions] = await Promise.all([
    getAllGroups(supabase),
    getAllStudents(supabase),
    getWritingSubmissions(supabase)
  ]);
  let sessions: Awaited<ReturnType<typeof getStudentDeviceSessions>> = [];
  let accessSetupWarning = "";
  try {
    sessions = await getStudentDeviceSessions(supabase);
  } catch (error) {
    console.error("Student device sessions unavailable", error);
    accessSetupWarning = "Device tracking is pending. Student IDs can still be created and used; apply the Supabase migration to enable close access, kick, and revoke controls.";
  }
  const deviceSessionsAvailable = !accessSetupWarning;
  const sessionsByStudent = new Map<string, typeof sessions>();
  sessions.forEach((session) => {
    sessionsByStudent.set(session.student_id, [...(sessionsByStudent.get(session.student_id) || []), session]);
  });
  const submissionsByStudent = new Map<string, typeof submissions>();
  submissions.forEach((submission) => {
    submissionsByStudent.set(submission.student_id, [...(submissionsByStudent.get(submission.student_id) || []), submission]);
  });
  const openStudents = students.filter((student) => isOpen(student)).length;
  const activeSessions = sessions.filter((session) => session.is_active !== false && !session.revoked_at).length;
  const reviewedAttempts = submissions.filter((submission) => submission.score != null).length;

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero">
        <div>
          <p className="eyebrow">Private access</p>
          <h1>Students, access, and progress</h1>
          <p className="muted">Issue login IDs, copy credentials quickly, check attempts, and manage device sessions from one student operations page.</p>
        </div>
      </div>

      <section className="stats-grid student-ops-stats" aria-label="Student operations summary">
        <StatCard label="Students" value={students.length} note={`${openStudents} open access IDs`} />
        <StatCard label="Attempts" value={submissions.length} note={`${reviewedAttempts} reviewed`} />
        <StatCard label="Active devices" value={activeSessions} note={deviceSessionsAvailable ? "tracked sessions" : "pending migration"} />
        <StatCard label="No login yet" value={students.filter((student) => !student.last_login_at).length} note="needs onboarding" />
      </section>

      <div className="student-access-grid">
        <Card className="panel access-create-card">
          <h2>Create access ID</h2>
          <p className="muted">Students can enter only after an access ID exists and is open.</p>
          <form action={createStudentAccessAction} className="form-stack">
            <label>
              Full name
              <Input name="name" placeholder="Miravzal S" required />
            </label>
            <label>
              Student Access ID
              <Input name="access_id" placeholder="1111111" required />
            </label>
            <label>
              Max devices
              <Input name="max_devices" type="number" min="1" placeholder="Optional" />
            </label>
            <label>
              Group
              <Select name="group_id" defaultValue="">
                <option value="">No group yet</option>
                {groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}
              </Select>
            </label>
            <Button>Create access</Button>
          </form>
        </Card>
        <Card className="panel access-summary-card">
          <span>Open IDs</span>
          <strong>{students.filter((student) => student.is_active !== false && student.access_status !== "closed").length}</strong>
          <small>
            {deviceSessionsAvailable
              ? `${sessions.filter((session) => session.is_active !== false && !session.revoked_at).length} active device sessions`
              : "Device tracking pending migration"}
          </small>
        </Card>
      </div>

      {accessSetupWarning ? <p className="setup-note">{accessSetupWarning}</p> : null}

      <Card className="panel">
        {students.length ? (
          <Table>
            <thead><tr><th>Student</th><th>Access ID</th><th>Group</th><th>Status</th><th>Progress</th><th>Devices</th><th>Actions</th></tr></thead>
            <tbody>
              {students.map((student) => {
                const studentSubmissions = submissionsByStudent.get(student.id) || [];
                const studentSessions = sessionsByStudent.get(student.id) || [];
                return (
                  <tr key={student.id}>
                    <td>
                      <div className="copy-row">
                        <strong>{student.name}</strong>
                        <CopyButton value={student.name} label="Copy name" />
                      </div>
                      <p className="table-note">{student.groups?.name || "No group"} · Last login {formatDate(student.last_login_at)}</p>
                    </td>
                    <td>
                      <div className="copy-row">
                        <code className="access-code">{student.student_code}</code>
                        <CopyButton value={student.student_code} label="Copy ID" />
                      </div>
                      <CopyButton value={`${student.name}\n${student.student_code}`} label="Copy login" />
                    </td>
                    <td>
                      <form action={updateStudentGroupAction} className="inline-form">
                        <input type="hidden" name="student_id" value={student.id} />
                        <Select name="group_id" defaultValue={student.group_id || ""}>
                          <option value="">No group</option>
                          {groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}
                        </Select>
                        <Button variant="secondary">Move</Button>
                      </form>
                    </td>
                    <td>{deviceSessionsAvailable ? (isOpen(student) ? <Badge tone="success">Open</Badge> : <Badge tone="warning">Closed</Badge>) : <Badge tone="warning">Legacy</Badge>}</td>
                    <td>
                      <div className="student-progress-mini">
                        <strong>{studentSubmissions.length}</strong>
                        <span>attempts</span>
                        <small>{studentSubmissions.filter((submission) => submission.score != null).length} reviewed · {studentSubmissions.filter((submission) => submission.feedback).length} feedback</small>
                      </div>
                    </td>
                    <td>
                      {deviceSessionsAvailable ? <DeviceSessionList sessions={studentSessions} /> : <span className="table-note">Device tracking pending. Student can still log in with this access ID.</span>}
                    </td>
                    <td>
                      {deviceSessionsAvailable ? (
                        <div className="table-actions">
                          <form action={toggleStudentAccessAction}>
                            <input type="hidden" name="student_id" value={student.id} />
                            <input type="hidden" name="open" value={String(!isOpen(student))} />
                            <Button variant={isOpen(student) ? "danger" : "secondary"}>{isOpen(student) ? "Close access" : "Open access"}</Button>
                          </form>
                          <form action={revokeAllDevicesAction}>
                            <input type="hidden" name="student_id" value={student.id} />
                            <Button variant="secondary">Revoke devices</Button>
                          </form>
                        </div>
                      ) : (
                        <span className="table-note">Run the migration to manage devices.</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : <EmptyState title="No students" body="Add students in Supabase or extend this admin screen with create student forms next." />}
      </Card>
    </AdminShell>
  );
}

function isOpen(student: { is_active?: boolean | null; access_status?: string | null }) {
  return student.is_active !== false && student.access_status !== "closed";
}

function DeviceSessionList({ sessions }: { sessions: Awaited<ReturnType<typeof getStudentDeviceSessions>> }) {
  if (!sessions.length) return <span className="table-note">No device sessions yet</span>;
  return (
    <div className="device-session-list">
      {sessions.slice(0, 4).map((session) => {
        const active = session.is_active !== false && !session.revoked_at;
        return (
          <div className="device-session" key={session.id}>
            <div>
              {active ? <Badge tone="success">Active Device</Badge> : <Badge tone="warning">Revoked</Badge>}
              <p>{shortUserAgent(session.user_agent)}</p>
              <small>Last seen {formatDate(session.last_seen_at)}</small>
            </div>
            {active ? (
              <form action={revokeDeviceSessionAction}>
                <input type="hidden" name="session_id" value={session.id} />
                <Button variant="danger">Kick</Button>
              </form>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function shortUserAgent(userAgent?: string | null) {
  if (!userAgent) return "Unknown browser";
  if (userAgent.includes("Chrome")) return "Chrome browser";
  if (userAgent.includes("Safari")) return "Safari browser";
  if (userAgent.includes("Firefox")) return "Firefox browser";
  return userAgent.slice(0, 42);
}

function formatDate(value?: string | null) {
  if (!value) return "never";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
