import Link from "next/link";
import { Badge, Card, EmptyState, StatCard, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAllLessons, getAllTasks, parseTaskContent, type TaskContent } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminShell } from "../components/AdminShell";

export default async function FullTestsPage() {
  const admin = await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const [lessons, tasks] = await Promise.all([getAllLessons(supabase), getAllTasks(supabase)]);
  const fullTests = tasks.filter((task) => task.skill === "full_test");
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const published = fullTests.filter((task) => task.lessons?.published === true).length;
  const studentAppUrl = getStudentAppUrl();

  return (
    <AdminShell email={admin.email}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Full test library</p>
          <h1>Exam bundles</h1>
          <p className="muted">Create Reading, Listening, and Writing practice in one IELTS-style student flow.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/full-tests/new">New Full Test</Link>
      </div>

      <section className="stats-grid" aria-label="Full test summary">
        <StatCard label="Full Tests" value={fullTests.length} note="total exam bundles" />
        <StatCard label="Published" value={published} note="visible to students" />
        <StatCard label="Drafts" value={fullTests.length - published} note="still hidden" />
        <StatCard label="Lessons" value={lessons.filter((lesson) => lesson.skill === "full_test").length} note="full-test lesson shells" />
      </section>

      <Card className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Builder output</p>
            <h2>Student-ready tests</h2>
          </div>
          <Link href="/admin/lessons">Open Content Studio</Link>
        </div>
        {fullTests.length ? (
          <Table>
            <thead><tr><th>Test</th><th>Sections</th><th>Timing</th><th>Status</th><th>Preview</th></tr></thead>
            <tbody>
              {fullTests.map((task) => {
                const content = parseTaskContent<TaskContent>(task.content, { questions: [] });
                const lesson = lessonById.get(task.lesson_id);
                const isPublished = task.lessons?.published === true;
                return (
                  <tr key={task.id}>
                    <td><strong>{task.title}</strong><br /><small>{lesson?.title || "Full test lesson"}</small></td>
                    <td>{content.sections?.length || 1} section(s)</td>
                    <td>{content.time_limit_minutes || content.duration_minutes || 180} min</td>
                    <td>{isPublished ? <Badge tone="success">Visible</Badge> : <Badge tone="warning">Draft</Badge>}</td>
                    <td>
                      {isPublished ? (
                        <a href={`${studentAppUrl}/tests/${task.id}`} target="_blank" rel="noreferrer">Preview as student</a>
                      ) : (
                        <span className="muted">Publish lesson first</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="No full tests yet"
            body="Import IELTS HTML in Test Builder. It will be saved as draft content before students can see it."
            action={<Link className="btn btn-primary" href="/admin/full-tests/new">Open Builder</Link>}
          />
        )}
      </Card>
    </AdminShell>
  );
}

function getStudentAppUrl() {
  if (process.env.NEXT_PUBLIC_STUDENT_APP_URL) return process.env.NEXT_PUBLIC_STUDENT_APP_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return "";
}
