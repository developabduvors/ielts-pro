import Link from "next/link";
import { Badge, Button, Card, EmptyState, Input, Select, StatCard, Table, Textarea } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAllLessons, getAllTasks, parseTaskContent, type Task, type TaskContent } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminShell } from "../components/AdminShell";
import { attachContentToLessonAction, createLessonAction, toggleLessonPublishAction } from "../actions/lms";

export default async function LessonsPage() {
  const admin = await requireAdminSession();
  const supabase = createServerSupabaseClient();
  const [lessons, tasks] = await Promise.all([
    getAllLessons(supabase),
    getAllTasks(supabase)
  ]);
  const publishedLessons = lessons.filter((lesson) => lesson.published);
  const draftLessons = lessons.filter((lesson) => !lesson.published);
  const draftContent = tasks.filter((task) => !task.lessons?.published || task.content_status === "draft");
  const importedContent = tasks.filter((task) => task.source_type === "html" || task.task_type === "imported_html");
  const studentAppUrl = getStudentAppUrl();

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero content-studio-hero">
        <div>
          <p className="eyebrow">Content Studio</p>
          <h1>LMS content control center.</h1>
          <p className="muted">Manage imported IELTS content, group lessons, publishing, and student visibility from one clean workspace.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-primary" href="/admin/full-tests/new">New content</Link>
          <a className="btn btn-secondary" href="#lesson-builder">New lesson</a>
        </div>
      </div>

      <section className="stats-grid content-stats" aria-label="Content summary">
        <StatCard label="Imported content" value={importedContent.length} note={`${draftContent.length} draft or hidden`} />
        <StatCard label="Published lessons" value={publishedLessons.length} note="visible after group match" />
        <StatCard label="Draft lessons" value={draftLessons.length} note="teacher-only" />
      </section>

      <div className="studio-tabs" aria-label="Content studio sections">
        <a href="#library">Library</a>
        <a href="#lesson-builder">Lesson Builder</a>
        <a href="#visibility">Visibility Matrix</a>
      </div>

      <section className="studio-section" id="library">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Library</p>
              <h2>Imported content and skill tasks</h2>
              <p className="muted">Content is private until it is attached to a published lesson. Counts below are live from Supabase; buttons here run real server actions.</p>
            </div>
            <Link className="inline-action" href="/admin/full-tests/new">Import HTML</Link>
          </div>
          <div className="library-summary" aria-label="Content counts">
            <span><strong>{tasks.length}</strong> total</span>
            <span><strong>{tasks.filter((task) => task.skill === "reading").length}</strong> reading</span>
            <span><strong>{tasks.filter((task) => task.skill === "listening").length}</strong> listening</span>
            <span><strong>{tasks.filter((task) => task.skill === "writing").length}</strong> writing</span>
            <span><strong>{tasks.filter((task) => task.lessons?.published).length}</strong> visible</span>
            <span><strong>{tasks.filter((task) => !task.lessons?.published).length}</strong> hidden</span>
          </div>
          {tasks.length ? (
            <Table>
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Type</th>
                  <th>Checks</th>
                  <th>Status</th>
                  <th>Where used</th>
                  <th>Attach</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const content = parseTaskContent<TaskContent>(task.content, {});
                  const published = task.lessons?.published === true;
                  return (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        <p className="table-note">{previewText(task, content)}</p>
                      </td>
                      <td>
                        <Badge tone={toneFor(task.skill)}>{labelFor(task.skill)}</Badge>
                        <p className="table-note">{task.source_type === "html" ? "HTML import" : task.task_type || "manual"}</p>
                      </td>
                      <td>
                        <div className="check-mini">
                          <span>{metric(task.question_count, content.question_count, countQuestions(content))} questions</span>
                          <span>{metric(task.answer_count, content.answer_count, 0)} keys</span>
                          <span>{task.audio_detected || content.audio_url ? "audio yes" : "audio no"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="status-control-stack">
                          {published ? <Badge tone="success">Visible</Badge> : <Badge tone="warning">Hidden</Badge>}
                          {task.lesson_id ? (
                            <form action={toggleLessonPublishAction}>
                              <input type="hidden" name="id" value={task.lesson_id} />
                              <input type="hidden" name="published" value={String(published)} />
                              <Button variant={published ? "secondary" : "primary"}>{published ? "Hide" : "Make visible"}</Button>
                            </form>
                          ) : (
                            <span className="table-note">Attach to a lesson first</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{task.lessons?.title || "No lesson"}</strong>
                      </td>
                      <td>
                        <form action={attachContentToLessonAction} className="inline-form">
                          <input type="hidden" name="task_id" value={task.id} />
                          <Select name="lesson_id" defaultValue={task.lesson_id || ""}>
                            <option value="">Choose lesson</option>
                            {lessons.map((lesson) => <option value={lesson.id} key={lesson.id}>{lesson.title}</option>)}
                          </Select>
                          <Button variant="secondary">Attach</Button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : <EmptyState title="No content yet" body="Import an HTML test in Test Builder. It will appear here first, hidden from students." action={<Link className="btn btn-primary" href="/admin/full-tests/new">Open Test Builder</Link>} />}
        </Card>
      </section>

      <section className="studio-section studio-columns" id="lesson-builder">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Lesson Builder</p>
              <h2>Create lesson shell</h2>
              <p className="muted">Create the lesson first, then attach imported content from the library above.</p>
            </div>
          </div>
          <form action={createLessonAction} className="lesson-builder-form lesson-builder-form-readable">
            <label>Title<Input name="title" required placeholder="Week 3 Reading focus" /></label>
            <label>Skill<Select name="skill" defaultValue="reading"><option value="reading">Reading</option><option value="listening">Listening</option><option value="writing">Writing</option><option value="full_test">Full test</option></Select></label>
            <label>Order<Input name="order" type="number" defaultValue={lessons.length + 1} min={1} /></label>
            <label className="span-2">Description<Textarea name="description" placeholder="Teacher note shown on student lesson card." /></label>
            <label className="check-row"><input type="checkbox" name="published" /> Publish now</label>
            <Button>Create lesson</Button>
          </form>
        </Card>
      </section>

      <section className="studio-section" id="visibility">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Student visibility</p>
              <h2>Task preview matrix</h2>
              <p className="muted">Status buttons publish or unpublish the lesson that contains the task.</p>
            </div>
          </div>
          {tasks.length ? (
            <Table>
              <thead><tr><th>Task</th><th>Skill</th><th>Status</th><th>Student route</th></tr></thead>
              <tbody>
                {tasks.map((task) => {
                  const published = task.lessons?.published === true;
                  return (
                    <tr key={task.id}>
                      <td><strong>{task.title}</strong><br /><small>{task.lessons?.title || "No lesson"}</small></td>
                      <td><Badge tone={toneFor(task.skill)}>{labelFor(task.skill)}</Badge></td>
                      <td>
                        <div className="status-control-stack">
                          {published ? <Badge tone="success">Visible</Badge> : <Badge tone="warning">Hidden</Badge>}
                          {task.lesson_id ? (
                            <form action={toggleLessonPublishAction}>
                              <input type="hidden" name="id" value={task.lesson_id} />
                              <input type="hidden" name="published" value={String(published)} />
                              <Button variant={published ? "secondary" : "primary"}>{published ? "Unpublish" : "Publish"}</Button>
                            </form>
                          ) : (
                            <span className="table-note">Attach to a lesson first</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {!task.lesson_id ? (
                          <span className="muted">Attach to lesson first</span>
                        ) : published ? (
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
          ) : <EmptyState title="No tasks yet" body="Import content before checking student visibility." />}
        </Card>
      </section>
    </AdminShell>
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

function metric(...values: Array<number | null | undefined>) {
  return values.find((value) => typeof value === "number" && value > 0) || 0;
}

function countQuestions(content: TaskContent) {
  return countQuestionUnits(content.questions) + (content.sections || []).reduce((sum, section) => sum + countQuestionUnits(section.questions), 0);
}

function countQuestionUnits(questions: TaskContent["questions"]) {
  return (questions || []).reduce((sum, question) => sum + (question.items?.length || 1), 0);
}

function previewText(task: Task, content: TaskContent) {
  if (content.preview_text) return content.preview_text.slice(0, 90);
  if (content.prompt) return content.prompt.slice(0, 90);
  if (content.instructions) return content.instructions.slice(0, 90);
  return task.content_status === "draft" ? "Draft imported content" : "Attached lesson content";
}
