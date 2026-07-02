import Link from "next/link";
import { Badge, Button, Card, EmptyState, Input, Select, StatCard, Table, Textarea } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAllLessons, getAllTasks } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../components/AdminShell";
import { createLessonAction, toggleLessonPublishAction } from "../actions/lms";

export default async function LessonsPage() {
  const admin = await requireAdminSession();
  const [lessons, tasks] = await Promise.all([
    getAllLessons(createServerSupabaseClient()),
    getAllTasks(createServerSupabaseClient())
  ]);
  const publishedLessons = lessons.filter((lesson) => lesson.published);
  const draftLessons = lessons.filter((lesson) => !lesson.published);
  const fullTests = tasks.filter((task) => task.skill === "full_test");
  const studentAppUrl = getStudentAppUrl();

  return (
    <AdminShell email={admin.email}>
      <div className="content-command">
        <div>
          <p className="eyebrow">Content studio</p>
          <h1>Control every IELTS practice flow.</h1>
          <p>Build lessons, attach tests, check publication state, and open the exact student preview without hunting through pages.</p>
        </div>
        <div className="command-cards" aria-label="Content shortcuts">
          <Link className="command-card command-card-primary" href="/full-tests/new">
            <span>Build</span>
            <strong>New full test</strong>
            <small>Reading, listening, writing</small>
          </Link>
          <Link className="command-card" href="#quick-lesson">
            <span>Create</span>
            <strong>Skill lesson</strong>
            <small>Lesson shell + publish</small>
          </Link>
          <Link className="command-card" href="/full-tests">
            <span>Library</span>
            <strong>Full tests</strong>
            <small>Manage bundles</small>
          </Link>
        </div>
      </div>

      <section className="stats-grid content-stats" aria-label="Content summary">
        <StatCard label="Published" value={publishedLessons.length} note="visible to students" />
        <StatCard label="Drafts" value={draftLessons.length} note="hidden until checked" />
        <StatCard label="Tasks" value={tasks.length} note="all skill practice" />
        <StatCard label="Full Tests" value={fullTests.length} note="exam-style bundles" />
      </section>

      <div className="content-workspace content-workspace-single">
        <aside className="quick-lesson-panel" id="quick-lesson">
          <Card className="panel quick-lesson-card">
            <div>
              <p className="eyebrow">Quick lesson</p>
              <h2>Create skill lesson</h2>
              <p className="muted">Fast path for simple lessons. Use Test Builder when the task needs passages, audio, sections, and answers.</p>
            </div>
            <form action={createLessonAction} className="quick-lesson-form">
              <label>Title<Input name="title" required /></label>
              <label>Description<Textarea name="description" /></label>
              <label>Skill<Select name="skill" defaultValue="reading"><option value="reading">Reading</option><option value="listening">Listening</option><option value="writing">Writing</option><option value="full_test">Full test</option></Select></label>
              <label>Order<Input name="order" type="number" defaultValue={lessons.length + 1} /></label>
              <label className="check-row"><input type="checkbox" name="published" /> Publish now</label>
              <Button>Create Lesson</Button>
            </form>
          </Card>
        </aside>

        <section className="studio-stack">
          <Card className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Skill map</p>
                <h2>Practice categories</h2>
              </div>
              <Link className="inline-action" href="/full-tests/new">Open builder</Link>
            </div>
            <div className="studio-skill-grid">
              <SkillTile label="Reading" value={tasks.filter((task) => task.skill === "reading").length} tone="reading" />
              <SkillTile label="Listening" value={tasks.filter((task) => task.skill === "listening").length} tone="listening" />
              <SkillTile label="Writing" value={tasks.filter((task) => task.skill === "writing").length} tone="writing" />
              <SkillTile label="Full Tests" value={fullTests.length} tone="full" />
            </div>
          </Card>

          <Card className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Lessons</p>
                <h2>Publish controls</h2>
              </div>
            </div>
            {lessons.length ? (
              <div className="lesson-list">
                {lessons.map((lesson) => {
                  const lessonTasks = tasks.filter((task) => task.lesson_id === lesson.id);
                  return (
                    <article className="lesson-card" key={lesson.id}>
                      <div>
                        <div className="lesson-card-top">
                          <Badge tone={lesson.published ? "success" : "warning"}>{lesson.published ? "Published" : "Draft"}</Badge>
                          <span>{labelFor(String(lesson.skill || "reading"))}</span>
                        </div>
                        <h3>{lesson.title}</h3>
                        <p className="muted">{lesson.description || "No description yet"}</p>
                        <div className="visibility-check">
                          <span className={lesson.published ? "ok" : "warn"}>{lesson.published ? "Student visible" : "Hidden from students"}</span>
                          <span className={lessonTasks.length ? "ok" : "warn"}>{lessonTasks.length ? `${lessonTasks.length} task(s)` : "No tasks yet"}</span>
                        </div>
                      </div>
                      <form action={toggleLessonPublishAction}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <input type="hidden" name="published" value={String(!!lesson.published)} />
                        <Button variant="secondary">{lesson.published ? "Unpublish" : "Publish"}</Button>
                      </form>
                    </article>
                  );
                })}
              </div>
            ) : <EmptyState title="No lessons yet" body="Create a lesson or build a full test to start the student content library." />}
          </Card>

          <Card className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Student visibility</p>
                <h2>Task preview matrix</h2>
                <p className="muted">Use this table to confirm what students can actually open.</p>
              </div>
            </div>
            {tasks.length ? (
              <Table>
                <thead><tr><th>Task</th><th>Skill</th><th>Status</th><th>Control</th><th>Student route</th></tr></thead>
                <tbody>
                  {tasks.map((task) => {
                    const published = task.lessons?.published === true;
                    return (
                      <tr key={task.id}>
                        <td><strong>{task.title}</strong><br /><small>{task.lessons?.title || "No lesson"}</small></td>
                        <td><Badge tone={toneFor(task.skill)}>{labelFor(task.skill)}</Badge></td>
                        <td>{published ? <Badge tone="success">Visible</Badge> : <Badge tone="warning">Draft</Badge>}</td>
                        <td>
                          <form action={toggleLessonPublishAction}>
                            <input type="hidden" name="id" value={task.lesson_id} />
                            <input type="hidden" name="published" value={String(published)} />
                            <Button variant={published ? "secondary" : "primary"}>{published ? "Unpublish" : "Publish"}</Button>
                          </form>
                        </td>
                        <td>
                          {published && studentAppUrl ? (
                            <a href={`${studentAppUrl}/tests/${task.id}`} target="_blank" rel="noreferrer">Preview as student</a>
                          ) : published ? (
                            <span className="muted">Set NEXT_PUBLIC_STUDENT_APP_URL for direct preview</span>
                          ) : (
                            <span className="muted">Publish lesson first</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            ) : <EmptyState title="No tasks yet" body="Use the Full Test Builder or add skill tasks before publishing." />}
          </Card>
        </section>

      </div>
    </AdminShell>
  );
}

function SkillTile({ label, value, tone }: { label: string; value: number; tone: "reading" | "listening" | "writing" | "full" }) {
  return (
    <div className={`studio-skill studio-skill-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>active task(s)</small>
    </div>
  );
}

function getStudentAppUrl() {
  if (process.env.NEXT_PUBLIC_STUDENT_APP_URL) return process.env.NEXT_PUBLIC_STUDENT_APP_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return "";
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
