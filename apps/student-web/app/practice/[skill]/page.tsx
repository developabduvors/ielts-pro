import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, EmptyState, LinkButton, ProgressBar, TestCard } from "@ielts-pro/ui";
import { createServerSupabaseClient, getPublishedTasks, getStudentSubmissions, parseTaskContent, type TaskContent } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../../components/StudentShell";

const skills = {
  reading: {
    db: "reading",
    label: "Reading",
    tone: "reading",
    copy: "Practice passages with completion, matching, headings, and multiple-choice questions.",
    filters: ["All Reading", "Passages", "Completion", "Matching"]
  },
  listening: {
    db: "listening",
    label: "Listening",
    tone: "listening",
    copy: "Train with audio-based tasks, notes, maps, tables, and objective answer sheets.",
    filters: ["All Listening", "Audio", "Notes", "MCQ"]
  },
  writing: {
    db: "writing",
    label: "Writing",
    tone: "writing",
    copy: "Submit Task 1 and Task 2 responses for teacher review and feedback history.",
    filters: ["All Writing", "Task 1", "Task 2", "Feedback"]
  },
  "full-tests": {
    db: "full_test",
    label: "Full Tests",
    tone: "full",
    copy: "Complete multi-skill IELTS practice with Reading, Listening, and Writing sections.",
    filters: ["All Tests", "Full Exam", "Timed", "Mixed Skills"]
  }
} as const;

type SkillSlug = keyof typeof skills;

export default async function SkillPracticePage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  if (!isSkillSlug(skill)) notFound();

  const config = skills[skill];
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [{ lessons, tasks }, submissions] = await Promise.all([
    getPublishedTasks(supabase),
    getStudentSubmissions(supabase, session.id)
  ]);
  const completedIds = new Set(submissions.map((submission) => submission.task_id));
  const skillTasks = tasks.filter((task) => task.skill === config.db);
  const completed = skillTasks.filter((task) => completedIds.has(task.id)).length;
  const progress = skillTasks.length ? Math.round((completed / skillTasks.length) * 100) : 0;

  return (
    <StudentShell name={session.name}>
      <main className="page">
        <section className={`skill-page-hero skill-page-${config.tone}`}>
          <div>
            <Link href="/practice" className="breadcrumb-link">Practice tests</Link>
            <h1>{config.label}</h1>
            <p>{config.copy}</p>
            <div className="filter-strip" aria-label={`${config.label} practice categories`}>
              {config.filters.map((filter) => <span key={filter}>{filter}</span>)}
            </div>
          </div>
          <div className="practice-score">
            <span>{config.label} progress</span>
            <strong>{progress}%</strong>
            <ProgressBar value={progress} label={`${config.label} progress`} />
            <small>{completed}/{skillTasks.length} submitted</small>
          </div>
        </section>

        <section className="task-meta-grid" aria-label={`${config.label} summary`}>
          <div><span>Available</span><strong>{skillTasks.length}</strong></div>
          <div><span>Completed</span><strong>{completed}</strong></div>
          <div><span>Open</span><strong>{skillTasks.length - completed}</strong></div>
        </section>

        <section>
          <div className="section-head">
            <h2>{config.label} practice list</h2>
            <Link href="/progress">History</Link>
          </div>
          <div className="test-list">
            {skillTasks.map((task) => {
              const content = parseTaskContent<TaskContent>(task.content, { questions: [] });
              const questionCount = countQuestions(content);
              const duration = content.time_limit_minutes || content.duration_minutes;
              return (
                <TestCard
                  key={task.id}
                  tone={config.tone}
                  meta={task.task_type || config.label}
                  title={task.title}
                  description={`${lessons.find((lesson) => lesson.id === task.lesson_id)?.title || "IELTS practice"}${questionCount ? ` • ${questionCount} questions` : ""}${duration ? ` • ${duration} min` : ""}`}
                  status={completedIds.has(task.id) ? <Badge tone="success">Submitted</Badge> : <Badge tone="warning">Open</Badge>}
                  action={<LinkButton href={`/tests/${task.id}`}>{completedIds.has(task.id) ? "Open result" : "Start test"}</LinkButton>}
                />
              );
            })}
            {!skillTasks.length ? (
              <EmptyState
                title={`No ${config.label.toLowerCase()} tasks yet`}
                body="When your teacher publishes work for this skill, it will appear here."
                action={<LinkButton href="/practice" variant="secondary">Back to skills</LinkButton>}
              />
            ) : null}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}

function isSkillSlug(value: string): value is SkillSlug {
  return value in skills;
}

function countQuestions(content: TaskContent) {
  const direct = content.questions?.length || 0;
  const sectionQuestions = content.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0;
  return direct + sectionQuestions;
}
