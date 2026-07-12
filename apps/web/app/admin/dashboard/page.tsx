import Link from "next/link";
import { Badge, Card, EmptyState, ErrorState, StatCard, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAdminDashboardStats, scoreToBand } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminShell } from "../components/AdminShell";

export default async function AdminDashboardPage() {
  const admin = await requireAdminSession();
  const stats = await getDashboardStatsSafely();
  if (!stats) {
    return (
      <AdminShell email={admin.email}>
        <div className="page-head page-head-hero dashboard-hero">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Supabase setup needs attention.</h1>
            <p className="muted">The admin app loaded, but one dashboard query failed. Apply the latest Supabase migration, then refresh this page.</p>
          </div>
          <div className="page-actions">
            <Link className="btn btn-primary" href="/admin/settings">Open settings</Link>
            <Link className="btn btn-secondary" href="/admin/students">Check students</Link>
          </div>
        </div>
        <Card className="panel">
          <ErrorState title="Dashboard data is not available yet" body="This usually means the database schema is behind the app code. The rest of the admin routes stay reachable so you can continue setup." />
        </Card>
      </AdminShell>
    );
  }
  const activeStudents = stats.students.filter((student) => student.is_active !== false && student.access_status !== "closed").length;
  const draftContent = stats.tasks.filter((task) => !task.lessons?.published || task.content_status === "draft").length;
  const scoredSubmissions = stats.submissions.filter((s) => {
    const skill = (s.tasks?.skill || "").toLowerCase();
    return (skill === "reading" || skill === "listening") && s.score != null && s.total;
  });
  const avgBand = scoredSubmissions.length
    ? Number((scoredSubmissions.reduce((sum, s) => sum + (scoreToBand(s.tasks?.skill || "", Number(s.score), Number(s.total)) ?? 0), 0) / scoredSubmissions.length).toFixed(1))
    : null;

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Operate the LMS from one clear overview.</h1>
          <p className="muted">Students, content, lessons, submissions, and writing review status are all pulled from Supabase.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-primary" href="/admin/full-tests/new">Import test</Link>
          <Link className="btn btn-secondary" href="/admin/students">Add student</Link>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard label="Students" value={stats.students.length} note={`${activeStudents} open access`} />
        <StatCard label="Avg Band Score" value={avgBand ?? "—"} note={`${scoredSubmissions.length} scored submissions`} />
        <StatCard label="Draft content" value={draftContent} note="waiting for attach/publish" />
      </section>

      <section className="stats-grid">
        <StatCard label="Pending writing" value={stats.pendingWriting.length} note="needs teacher review" />
        <StatCard label="Recent submissions" value={stats.submissions.length} note="all attempts" />
        <StatCard label="Tasks" value={stats.tasks.length} note="reading/listening/writing" />
      </section>

      <div className="panel-grid">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Recent submissions</p>
              <h2>Latest student work</h2>
            </div>
            <Link href="/admin/submissions">Open queue</Link>
          </div>
          {stats.submissions.length ? (
            <Table>
              <thead><tr><th>Student</th><th>Task</th><th>Score</th><th>Date</th></tr></thead>
              <tbody>
                {stats.submissions.slice(0, 8).map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.students?.name || "Student"}</td>
                    <td>{submission.tasks?.title || "Task"}<p className="table-note">{submission.tasks?.lessons?.title || "No lesson"}</p></td>
                    <td>{submission.score != null ? `${submission.score}/${submission.total ?? "band"}` : <Badge tone="warning">Pending</Badge>}</td>
                    <td>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(submission.submitted_at))}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : <EmptyState title="No submissions yet" body="Student attempts will appear here after the first published lesson is completed." />}
        </Card>

        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h2>Most used controls</h2>
            </div>
          </div>
          <div className="quick-action-list">
            <Link href="/admin/students" className="quick-action">Add student access</Link>
            <Link href="/admin/full-tests/new" className="quick-action">Import HTML test</Link>
            <Link href="/admin/submissions" className="quick-action">Open writing review</Link>
          </div>
        </Card>
      </div>

      <div className="panel-grid dashboard-lower">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Writing queue</p>
              <h2>Pending review</h2>
            </div>
          </div>
          <div className="lesson-list">
            {stats.pendingWriting.slice(0, 6).map((submission) => (
              <div className="attention-row" key={submission.id}>
                <strong>{submission.students?.name || "Student"}</strong>
                <span>{submission.tasks?.title || "Writing task"}</span>
                <Link href="/admin/submissions">Review</Link>
              </div>
            ))}
            {!stats.pendingWriting.length ? <EmptyState title="Writing queue is clear" body="Writing attempts that need scores will appear here." /> : null}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

async function getDashboardStatsSafely() {
  try {
    return await getAdminDashboardStats(createServerSupabaseClient());
  } catch (error) {
    console.error("Admin dashboard stats failed", error);
    return null;
  }
}
