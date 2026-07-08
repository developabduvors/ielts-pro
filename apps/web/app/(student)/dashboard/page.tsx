import Link from "next/link";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentById, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import {
  completionState,
  feedbackSubmissions,
  formatDate,
  listeningSeries,
  nextTask,
  overallScore,
  scoresBySkill
} from "../student-utils";
import { LineChart, PieChart } from "./charts";

const MOTIVATION = [
  "Small daily practice beats one long cram session.",
  "Every mock test makes the real exam easier.",
  "Consistency is the fastest path to a higher band.",
  "Review your mistakes — that is where the points hide.",
  "You improve the day you stop avoiding your weak skill.",
  "Read a little English every single day.",
  "Progress is quiet. Keep showing up."
];

export default async function DashboardPage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const currentGroupId = student?.group_id ?? session.group_id;
  const [{ tasks }, submissions] = await Promise.all([
    getPublishedTasksForStudent(supabase, currentGroupId),
    getStudentSubmissions(supabase, session.id)
  ]);

  const progress = completionState(tasks, submissions);
  const next = nextTask(tasks, submissions);
  const feedback = feedbackSubmissions(submissions);
  const scores = scoresBySkill(submissions);
  const overall = overallScore(submissions);
  const listening = listeningSeries(submissions);

  const firstName = session.name.split(" ")[0] || session.name;
  const now = new Date();
  const dateLabel = `${new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(now)}, ${new Intl.DateTimeFormat("en", { weekday: "long" }).format(now)}`;
  const quickHref = next ? `/tests/${next.id}` : "/practice";
  const motivation = MOTIVATION[now.getDay() % MOTIVATION.length];

  return (
    <StudentShell name={session.name} groupName={student?.groups?.name || "Group pending"}>
      <main className="student-page student-dash">
        <section className="student-dash-top">
          <article className="student-dash-welcome">
            <div className="student-dash-welcome-head">
              <h1>Welcome back, {firstName}</h1>
              <span>{dateLabel}</span>
            </div>
            <div className="student-dash-welcome-body">
              <div className="student-dash-scores">
                {scores.map((s) => (
                  <p key={s.key}><span>{s.label}:</span> {s.value ?? "—"}</p>
                ))}
              </div>
              <strong className="student-dash-band">{overall ?? "—"}</strong>
              <Link
                className="student-dash-quickstart"
                href={quickHref}
                target={next ? "_blank" : undefined}
                rel={next ? "noopener noreferrer" : undefined}
              >
                Quick start
              </Link>
            </div>
          </article>

          <aside className="student-dash-inbox">
            <div className="student-dash-inbox-head">
              <h2>Inbox</h2>
              <span className="student-dash-inbox-count" data-empty={feedback.length === 0}>
                {feedback.length || ""}
              </span>
            </div>
            {feedback[0] ? (
              <div className="student-dash-inbox-body">
                <strong>{feedback[0].tasks?.title || "Teacher feedback"}</strong>
                <p>{feedback[0].feedback}</p>
                <small>{formatDate(feedback[0].submitted_at, { dateStyle: "medium" })}</small>
              </div>
            ) : (
              <p className="student-muted">No teacher feedback yet.</p>
            )}
          </aside>
        </section>

        <section className="student-dash-row">
          <article className="student-dash-card student-dash-listening">
            <h2>Listening</h2>
            <LineChart data={listening} />
          </article>

          <article className="student-dash-card student-dash-completed">
            <h2>Completed</h2>
            <PieChart percent={progress.percent} />
          </article>

          <article className="student-dash-card student-dash-motivation">
            <h2>Motivation</h2>
            <p>{motivation}</p>
          </article>
        </section>
      </main>
    </StudentShell>
  );
}
