import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, EmptyState, LinkButton, ProgressBar, StatCard } from "@ielts-pro/ui";
import { createServerSupabaseClient, getPublishedTasks, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { studentLogout } from "../actions/auth";

export default async function DashboardPage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [{ lessons, tasks }, submissions] = await Promise.all([
    getPublishedTasks(supabase),
    getStudentSubmissions(supabase, session.id)
  ]);
  const completedIds = new Set(submissions.map((submission) => submission.task_id));
  const completed = completedIds.size;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const writingPending = submissions.filter((submission) => submission.tasks?.skill === "writing" && submission.score == null).length;

  if (!session) redirect("/");

  return (
    <>
      <Topbar name={session.name} />
      <main className="page">
        <Card className="hero-card">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1>Welcome, {session.name}</h1>
            <p>Work through published IELTS practice, submit answers, and check teacher feedback without losing your place.</p>
          </div>
          <div className="hero-meter">
            <span>Course progress</span>
            <strong>{progress}%</strong>
            <ProgressBar value={progress} label="Overall progress" />
          </div>
        </Card>

        <section className="stats-grid" aria-label="Progress summary">
          <StatCard label="Available Tasks" value={tasks.length} note={`${lessons.length} published lessons`} />
          <StatCard label="Completed" value={completed} note="submitted attempts" />
          <StatCard label="Writing Pending" value={writingPending} note="waiting for review" />
          <StatCard label="Feedback" value={submissions.filter((s) => !!s.feedback).length} note="teacher notes received" />
        </section>

        <div className="content-grid">
          <section>
            <div className="section-head">
              <h2>Published Tests</h2>
              <Link href="/progress">View progress</Link>
            </div>
            <div className="test-list">
              {tasks.length ? tasks.map((task) => (
                <Card className="test-card" key={task.id}>
                  <div>
                    <Badge tone={toneFor(task.skill)}>{labelFor(task.skill)}</Badge>
                    <h3>{task.title}</h3>
                    <p>{lessons.find((lesson) => lesson.id === task.lesson_id)?.title || "IELTS practice"}</p>
                    {completedIds.has(task.id) ? <Badge tone="success">Submitted</Badge> : null}
                  </div>
                  <LinkButton href={`/tests/${task.id}`}>{completedIds.has(task.id) ? "Review" : "Start"}</LinkButton>
                </Card>
              )) : <EmptyState title="No published tests" body="Your teacher has not published practice work yet." />}
            </div>
          </section>

          <aside>
            <div className="section-head"><h2>Recent Attempts</h2></div>
            <div className="attempt-list">
              {submissions.slice(0, 6).map((submission) => (
                <Card className="attempt-item" key={submission.id}>
                  <strong>{submission.tasks?.title || "Practice task"}</strong>
                  <small>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(submission.submitted_at))}</small>
                  {submission.score != null ? <span>{submission.score}/{submission.total ?? "?"}</span> : <Badge tone="warning">Pending review</Badge>}
                </Card>
              ))}
              {!submissions.length ? <EmptyState title="No attempts yet" body="Start a test to build your progress history." /> : null}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function Topbar({ name }: { name: string }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/dashboard">IELTS <span>Pro</span></Link>
        <nav className="nav" aria-label="Student navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/progress">Progress</Link>
          <form action={studentLogout}><button className="btn btn-ghost">Logout {name}</button></form>
        </nav>
      </div>
    </header>
  );
}

function toneFor(skill: string) {
  if (skill === "reading") return "reading";
  if (skill === "listening") return "listening";
  if (skill === "writing") return "writing";
  return "neutral";
}

function labelFor(skill: string) {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  if (skill === "writing") return "Writing";
  if (skill === "full_test") return "Full Test";
  return skill;
}
