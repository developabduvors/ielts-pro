import { Badge, Button, Card, EmptyState, Input, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAllStudents, getStudentDeviceSessions } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { createStudentAccessAction, revokeAllDevicesAction, revokeDeviceSessionAction, toggleStudentAccessAction } from "../actions/lms";
import { AdminShell } from "../components/AdminShell";

export default async function StudentsPage() {
  const admin = await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const students = await getAllStudents(supabase);
  let sessions: Awaited<ReturnType<typeof getStudentDeviceSessions>> = [];
  let accessSetupWarning = "";
  try {
    sessions = await getStudentDeviceSessions(supabase);
  } catch (error) {
    console.error("Student device sessions unavailable", error);
    accessSetupWarning = "Student device sessions are not available yet. Apply the Supabase student access migration before using device kick/revoke.";
  }
  const sessionsByStudent = new Map<string, typeof sessions>();
  sessions.forEach((session) => {
    sessionsByStudent.set(session.student_id, [...(sessionsByStudent.get(session.student_id) || []), session]);
  });

  return (
    <AdminShell email={admin.email}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Private access</p>
          <h1>Student Access</h1>
          <p className="muted">Create teacher-issued access IDs, open or close access, and revoke individual device sessions.</p>
        </div>
      </div>

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
            <Button>Create access</Button>
          </form>
        </Card>
        <Card className="panel access-summary-card">
          <span>Open IDs</span>
          <strong>{students.filter((student) => student.is_active !== false && student.access_status !== "closed").length}</strong>
          <small>{sessions.filter((session) => session.is_active !== false && !session.revoked_at).length} active device sessions</small>
        </Card>
      </div>

      {accessSetupWarning ? <p className="form-error">{accessSetupWarning}</p> : null}

      <Card className="panel">
        {students.length ? (
          <Table>
            <thead><tr><th>Name</th><th>Access ID</th><th>Status</th><th>Devices</th><th>Actions</th></tr></thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.name}</strong>
                    <p className="table-note">{student.groups?.name || "No group"} · Last login {formatDate(student.last_login_at)}</p>
                  </td>
                  <td><code className="access-code">{student.student_code}</code></td>
                  <td>{isOpen(student) ? <Badge tone="success">Open</Badge> : <Badge tone="warning">Closed</Badge>}</td>
                  <td>
                    <DeviceSessionList sessions={sessionsByStudent.get(student.id) || []} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <form action={toggleStudentAccessAction}>
                        <input type="hidden" name="student_id" value={student.id} />
                        <input type="hidden" name="open" value={String(!isOpen(student))} />
                        <Button variant={isOpen(student) ? "danger" : "secondary"}>{isOpen(student) ? "Close access" : "Open access"}</Button>
                      </form>
                      <form action={revokeAllDevicesAction}>
                        <input type="hidden" name="student_id" value={student.id} />
                        <Button variant="secondary">Revoke all devices</Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
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
