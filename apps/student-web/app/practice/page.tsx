import Link from "next/link";
import { Badge, EmptyState, LinkButton, ProgressBar, StatCard, TestCard } from "@ielts-pro/ui";
import { createServerSupabaseClient, getPublishedTasks, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";

const skillCards = [
  {
    href: "/practice/reading",
    className: "skill-reading",
    label: "Reading",
    copy: "Passages, matching, headings, completion",
    skill: "reading"
  },
  {
    href: "/practice/listening",
    className: "skill-listening",
    label: "Listening",
    copy: "Audio tasks, note completion, multiple choice",
    skill: "listening"
  },
  {
    href: "/practice/writing",
    className: "skill-writing",
    label: "Writing",
    copy: "Task 1 and Task 2 responses with feedback",
    skill: "writing"
  },
  {
    href: "/practice/full-tests",
    className: "skill-full",
    label: "Full Tests",
    copy: "Reading, Listening, and Writing in one flow",
    skill: "full_test"
  }
] as const;

export default async function PracticePage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [{ lessons, tasks }, submissions] = await Promise.all([
    getPublishedTasks(supabase),
    getStudentSubmissions(supabase, session.id)
  ]);
  const completedIds = new Set(submissions.map((submission) => submission.task_id));
  const completed = completedIds.size;
  const openTasks = tasks.filter((task) => !completedIds.has(task.id));
  const nextTask = openTasks[0] || tasks[0];
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <StudentShell name={session.name}>
      <main className="page">
        <section className="practice-hero">
          <div>
            <p className="eyebrow">Practice tests</p>
            <h1>Choose your IELTS skill and continue your plan.</h1>
            <p className="muted">Work through published teacher materials by skill, track attempts, and keep writing feedback in one place.</p>
            <div className="hero-actions">
              {nextTask ? <LinkButton href={`/tests/${nextTask.id}`}>Continue next task</LinkButton> : null}
              <LinkButton href="/progress" variant="secondary">Result history</LinkButton>
            </div>
          </div>
          <div className="practice-score">
            <span>Course progress</span>
            <strong>{progress}%</strong>
            <ProgressBar value={progress} label="Course progress" />
            <small>{completed}/{tasks.length} tasks submitted</small>
          </div>
        </section>

        <section className="practice-skills" aria-label="Choose a skill">
          {skillCards.map((card) => {
            const count = tasks.filter((task) => task.skill === card.skill).length;
            const done = tasks.filter((task) => task.skill === card.skill && completedIds.has(task.id)).length;
            return (
              <Link href={card.href} className={`practice-skill-link ${card.className}`} key={card.href}>
                <span>{card.label}</span>
                <strong>{count}</strong>
                <small>{card.copy}</small>
                <em>{done}/{count} completed</em>
              </Link>
            );
          })}
        </section>

        <section className="stats-grid" aria-label="Practice summary">
          <StatCard label="Lessons" value={lessons.length} note="published by teacher" />
          <StatCard label="Open Tasks" value={openTasks.length} note="available now" />
          <StatCard label="Attempts" value={submissions.length} note="total submissions" />
          <StatCard label="Feedback" value={submissions.filter((submission) => submission.feedback).length} note="teacher notes" />
        </section>

        <section>
          <div className="section-head">
            <h2>Latest published work</h2>
            <Link href="/dashboard">Dashboard</Link>
          </div>
          <div className="test-list">
            {tasks.slice(0, 8).map((task) => (
              <TestCard
                key={task.id}
                tone={toneFor(task.skill)}
                meta={labelFor(task.skill)}
                title={task.title}
                description={lessons.find((lesson) => lesson.id === task.lesson_id)?.title || "IELTS practice"}
                status={completedIds.has(task.id) ? <Badge tone="success">Submitted</Badge> : <Badge tone="warning">Open</Badge>}
                action={<LinkButton href={`/tests/${task.id}`}>{completedIds.has(task.id) ? "Review" : "Start"}</LinkButton>}
              />
            ))}
            {!tasks.length ? <EmptyState title="No practice yet" body="Your teacher has not published IELTS practice work yet." /> : null}
          </div>
        </section>
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
