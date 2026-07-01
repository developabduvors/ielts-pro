import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, EmptyState, LinkButton, ProgressBar, StatCard, TestCard } from "@ielts-pro/ui";
import { createServerSupabaseClient, getPublishedTasks, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";

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
  const readingCount = tasks.filter((task) => task.skill === "reading").length;
  const listeningCount = tasks.filter((task) => task.skill === "listening").length;
  const writingCount = tasks.filter((task) => task.skill === "writing").length;

  return (
    <StudentShell name={session.name}>
      <main className="page">
        <Card className="hero-card">
          <div>
            <p className="eyebrow">Student practice plan</p>
            <h1>Welcome back, {session.name}</h1>
            <p>Choose a skill, complete published practice, and keep your result history ready for your teacher.</p>
            <div className="hero-actions">
              <LinkButton href="/practice">Start practice</LinkButton>
              <LinkButton variant="secondary" href="/progress">View results</LinkButton>
            </div>
            <div className="exam-strip" aria-label="Practice flow">
              <span>Choose skill</span>
              <span>Answer task</span>
              <span>Review result</span>
            </div>
          </div>
          <div className="hero-meter">
            <span>Overall completion</span>
            <strong>{progress}%</strong>
            <ProgressBar value={progress} label="Overall progress" />
            <small>{completed}/{tasks.length || 0} tasks submitted</small>
          </div>
        </Card>

        <section className="skill-grid" aria-label="IELTS skill categories">
          <Link href="/practice/reading" className="card skill-card skill-reading"><span>Reading</span><strong>{readingCount}</strong><small>passage tasks</small></Link>
          <Link href="/practice/listening" className="card skill-card skill-listening"><span>Listening</span><strong>{listeningCount}</strong><small>audio tasks</small></Link>
          <Link href="/practice/writing" className="card skill-card skill-writing"><span>Writing</span><strong>{writingCount}</strong><small>teacher-reviewed</small></Link>
          <Link href="/practice/full-tests" className="card skill-card skill-full"><span>Full tests</span><strong>{tasks.filter((task) => task.skill === "full_test").length}</strong><small>exam practice</small></Link>
        </section>

        <section className="stats-grid" aria-label="Progress summary">
          <StatCard label="Available Tasks" value={tasks.length} note={`${lessons.length} published lessons`} />
          <StatCard label="Completed" value={completed} note="submitted attempts" />
          <StatCard label="Writing Pending" value={writingPending} note="waiting for review" />
          <StatCard label="Feedback" value={submissions.filter((s) => !!s.feedback).length} note="teacher notes received" />
        </section>

        <div className="content-grid">
          <section id="practice">
            <div className="section-head">
              <h2>Published Tests</h2>
              <Link href="/progress">View progress</Link>
            </div>
            <div className="test-list">
              {tasks.length ? tasks.map((task) => (
                <TestCard
                  key={task.id}
                  tone={toneFor(task.skill)}
                  meta={labelFor(task.skill)}
                  title={task.title}
                  description={lessons.find((lesson) => lesson.id === task.lesson_id)?.title || "IELTS practice"}
                  status={completedIds.has(task.id) ? <Badge tone="success">Submitted</Badge> : <Badge tone="warning">Open</Badge>}
                  action={<LinkButton href={`/tests/${task.id}`}>{completedIds.has(task.id) ? "Review" : "Start"}</LinkButton>}
                />
              )) : <EmptyState title="No published tests" body="Your teacher has not published practice work yet." />}
            </div>
          </section>

          <aside className="right-rail">
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
    </StudentShell>
  );
}

function toneFor(skill: string) {
  if (skill === "reading") return "reading";
  if (skill === "listening") return "listening";
  if (skill === "writing") return "writing";
  if (skill === "full_test") return "full";
  return "neutral";
}

function labelFor(skill: string) {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  if (skill === "writing") return "Writing";
  if (skill === "full_test") return "Full Test";
  return skill;
}
