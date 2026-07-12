import { Badge, Card, EmptyState, StatCard, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAdminDashboardStats } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminShell } from "../components/AdminShell";

export default async function AnalyticsPage() {
  const admin = await requireAdminSession();
  const stats = await getAdminDashboardStats(createServerSupabaseClient());
  const scored = stats.submissions.filter((submission) => submission.score != null);
  const reading = scored.filter((submission) => submission.tasks?.skill === "reading");
  const listening = scored.filter((submission) => submission.tasks?.skill === "listening");
  const writingPending = stats.submissions.filter((submission) => submission.tasks?.skill === "writing" && submission.score == null);

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Progress signals without fake charts.</h1>
          <p className="muted">Real submission, content, and writing-review data from Supabase.</p>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard label="Avg Reading" value={average(reading)} note={`${reading.length} scored attempt(s)`} />
        <StatCard label="Avg Listening" value={average(listening)} note={`${listening.length} scored attempt(s)`} />
        <StatCard label="Writing pending" value={writingPending.length} note="review queue" />
        <StatCard label="Lesson coverage" value={stats.lessons.filter((lesson) => lesson.published).length} note={`${stats.lessons.length} total lessons`} />
      </section>

      <div className="panel-grid">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Difficult work</p>
              <h2>Lowest scored attempts</h2>
            </div>
          </div>
          <div className="lesson-list">
            {scored.sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 6).map((submission) => (
              <div className="analytics-item" key={submission.id}>
                <strong>{submission.tasks?.title || "Task"}</strong>
                <span>{submission.students?.name || "Student"}</span>
                <Badge tone="warning">{submission.score}/{submission.total ?? "band"}</Badge>
              </div>
            ))}
            {!scored.length ? <EmptyState title="No scored attempts yet" body="Reading and Listening analytics appear after students submit auto-checked answers." /> : null}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function average(items: Array<{ score: number | null }>) {
  if (!items.length) return "-";
  return (items.reduce((sum, item) => sum + (item.score || 0), 0) / items.length).toFixed(1);
}
