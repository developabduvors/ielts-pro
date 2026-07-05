import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, EmptyState, Input, QuestionNavigator } from "@ielts-pro/ui";
import { buildRenderableQuestions, createServerSupabaseClient, getPublishedTaskByIdForStudent, getStudentById, getSubmissionForTask, getTaskAudioUrl, parseTaskContent, sanitizeTeacherHtml, type Question, type Task, type TaskContent } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { submitTaskAttempt } from "../../actions/attempts";
import { StudentShell } from "../../components/StudentShell";
import { WritingAnswerBox } from "../../components/WritingAnswerBox";



export default async function TestPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const currentGroupId = student?.group_id ?? session.group_id;
  const [task, existingSubmission] = await Promise.all([
    getPublishedTaskByIdForStudent(supabase, taskId, currentGroupId),
    getSubmissionForTask(supabase, session.id, taskId)
  ]);
  if (!task) notFound();

  if (task.html_path) {
    const download = await supabase.storage.from("html-tests").download(task.html_path);
    let htmlTest: string | null = null;
    if (download.data) {
      const rawHtml = await download.data.text();
      const bridge = `<script>
(function(){
  var TASK_ID = ${JSON.stringify(task.id)};
  window.submitIeltsScore = async function(result){
    result = result || {};
    try {
      var res = await fetch('/api/html-attempts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskId: TASK_ID, score: result.score, total: result.total, answers: result.answers || null })
      });
      var json = await res.json();
      if (!json || !json.ok) console.error('submitIeltsScore rejected', json);
      return json;
    } catch (err) {
      console.error('submitIeltsScore failed', err);
      return { ok: false };
    }
  };
})();
</script>`;
      htmlTest = rawHtml.includes("</body>")
        ? rawHtml.replace("</body>", `${bridge}</body>`)
        : `${rawHtml}${bridge}`;
    }

    return (
      <StudentShell name={session.name}>
        <main className="test-page html-test">
          <div className="exam-topline">
            <div>
              <Badge tone={toneFor(task.skill)}>{labelFor(task.skill)}</Badge>
            </div>
            <div className="topline-actions">
              {existingSubmission?.score != null ? (
                <span className="submission-score">Score: {existingSubmission.score}/{existingSubmission.total ?? "?"}</span>
              ) : null}
              <Link href="/dashboard" className="btn btn-secondary">Exit test</Link>
            </div>
          </div>
          {existingSubmission ? (
            <Card className="submitted-panel" style={{ marginBottom: 12 }}>
              <div>
                <Badge tone="success">Submitted</Badge>
                <span>Your result is saved.</span>
              </div>
            </Card>
          ) : null}
          {!htmlTest ? (
            <div className="html-test-viewer-status">
              <p className="form-error">Test file is missing. Ask your teacher to re-upload it.</p>
            </div>
          ) : (
            <iframe
              className="html-test-iframe"
              srcDoc={htmlTest}
              title={task.title}
            />
          )}
        </main>
      </StudentShell>
    );
  }

  const content = parseTaskContent<TaskContent>(task.content, { questions: [] });
  const questions = buildRenderableQuestions(content, task);
  const audioUrl = getTaskAudioUrl(content, task);
  const questionCount = questions.length;
  const isFullTest = task.skill === "full_test";
  const timeLabel = content.time_limit_minutes || content.duration_minutes ? `${content.time_limit_minutes || content.duration_minutes} min` : "Study mode";

  return (
    <StudentShell name={session.name}>
      <main className="test-page">
        <div className="exam-topline">
          <div>
            <Badge tone={toneFor(task.skill)}>{labelFor(task.skill)}</Badge>
            <h1>{task.title}</h1>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">Exit test</Link>
        </div>

        {existingSubmission ? (
          <Card className="submitted-panel">
            <div>
              <Badge tone="success">Submitted</Badge>
              <h2>Your answer is saved</h2>
              <p>{existingSubmission.score != null ? `Score: ${existingSubmission.score}/${existingSubmission.total ?? "?"}` : "Writing submissions wait for teacher review."}</p>
              {existingSubmission.feedback ? <p><strong>Teacher feedback:</strong> {existingSubmission.feedback}</p> : null}
            </div>
            <Link href="/progress" className="btn btn-primary">View progress</Link>
          </Card>
        ) : (
          <form action={submitTaskAttempt} className="exam-layout">
            <input type="hidden" name="taskId" value={task.id} />
            <div className="exam-status-strip">
              <span>{questionCount || (task.skill === "writing" ? 1 : 0)} tasks</span>
              <span>{timeLabel}</span>
              <span>{task.skill === "writing" ? "Teacher reviewed" : "Auto checked"}</span>
            </div>
            <section className="card passage">
              {isFullTest ? (
                <FullTestBrief content={content} task={task} />
              ) : task.skill === "writing" ? (
                <>
                  <p className="eyebrow">Writing prompt</p>
                  <h2>Task response</h2>
                  <p>{content.prompt || "Write your answer for this task."}</p>
                  {content.time_limit_minutes ? <p className="muted">Suggested time: {content.time_limit_minutes} minutes</p> : null}
                </>
              ) : task.skill === "listening" ? (
                <>
                  <p className="eyebrow">Listening audio</p>
                  <h2>Listen and answer</h2>
                  <p>{content.instructions || "Listen and answer the questions."}</p>
                  {audioUrl ? (
                    <audio controls src={audioUrl} className="audio-player" />
                  ) : (
                    <p className="form-error">No listening audio was found in this import. Ask the teacher to attach an audio URL before publishing it as Listening.</p>
                  )}
                </>
              ) : (
                <>
                  <p className="eyebrow">Reading passage</p>
                  <h2>Passage</h2>
                  <div className="passage-content" dangerouslySetInnerHTML={{ __html: sanitizeTeacherHtml(content.passage_html || content.imported_html || content.passages?.[0]?.html || "") }} />
                </>
              )}
            </section>
            <section className="card question-panel">
              <div className="question-panel-head">
                <div>
                  <p className="eyebrow">Answer sheet</p>
                <h2>{task.skill === "writing" ? "Your response" : `${questionCount} questions`}</h2>
                </div>
                {content.time_limit_minutes ? <Badge tone="warning">{content.time_limit_minutes} min</Badge> : null}
              </div>
              {task.skill === "writing" ? (
                <WritingAnswerBox name="writing_answer" label="Your response" placeholder="Write your IELTS response here..." minWords={content.min_words} required />
              ) : (
                <>
                  {questions.length ? questions.map((question, index) => <QuestionInput question={question} index={index} key={index} />) : (
                    <EmptyState
                      title="Teacher answer sheet needs review"
                      body="The imported HTML is saved, but the parser could not build student answer fields. Ask the teacher to review the Test Builder preview before publishing."
                    />
                  )}
                  {isFullTest && writingPrompt(content) ? (
                    <WritingAnswerBox name="full_writing_answer" label="Writing response" placeholder="Write your Task 1 and Task 2 responses here..." minWords={content.min_words} />
                  ) : null}
                </>
              )}
              <Button type="submit">Submit answers</Button>
            </section>
            <aside className="card test-aside">
              <h3>Question navigator</h3>
              <QuestionNavigator count={questionCount} />
              <p className="muted">Use the numbers to jump through the task. Review your answers before submitting.</p>
            </aside>
          </form>
        )}
      </main>
    </StudentShell>
  );
}

function FullTestBrief({ content, task }: { content: TaskContent; task: Task }) {
  const sections = content.sections || [];
  const reading = sections.find((section) => section.skill === "reading");
  const listening = sections.find((section) => section.skill === "listening");
  const writing = sections.find((section) => section.skill === "writing");
  const audioUrl = getTaskAudioUrl(content, task);

  return (
    <>
      <p className="eyebrow">Full IELTS practice</p>
      <h2>Reading, Listening, Writing</h2>
      <p className="muted">{content.instructions || "Complete each section and submit all answers at the end."}</p>
      <div className="full-test-sections">
        <section>
          <Badge tone="reading">Reading</Badge>
          <h3>{reading?.title || "Reading section"}</h3>
          <div className="passage-content" dangerouslySetInnerHTML={{ __html: sanitizeTeacherHtml(reading?.passage_html || content.passage_html || "") }} />
        </section>
        <section>
          <Badge tone="listening">Listening</Badge>
          <h3>{listening?.title || "Listening section"}</h3>
          {audioUrl ? <audio controls src={audioUrl} className="audio-player" /> : <p className="form-error">No listening audio was found in this import.</p>}
        </section>
        <section>
          <Badge tone="writing">Writing</Badge>
          <h3>{writing?.title || "Writing section"}</h3>
          <p>{writing?.prompt || content.prompt || "Your teacher has not added a writing prompt yet."}</p>
        </section>
      </div>
    </>
  );
}

function writingPrompt(content: TaskContent) {
  return content.prompt || content.sections?.some((section) => section.skill === "writing" && section.prompt);
}

function QuestionInput({ question, index }: { question: Question; index: number }) {
  if (question.options?.length) {
    const multiple = question.type === "mcq_multi";
    return (
      <fieldset className="question" id={`question-${index + 1}`}>
        <legend><strong>{index + 1}. {question.question}</strong></legend>
        {question.options.map((option, optionIndex) => {
          const letter = String.fromCharCode(65 + optionIndex);
          return (
            <label className="option-row" key={letter}>
              <input type={multiple ? "checkbox" : "radio"} name={`q_${index}`} value={letter} />
              <span>{letter}. {option}</span>
            </label>
          );
        })}
      </fieldset>
    );
  }

  if (question.items?.length) {
    return (
      <fieldset className="question" id={`question-${index + 1}`}>
        <legend><strong>{index + 1}. {question.question || "Complete the items"}</strong></legend>
        {question.items.map((item, itemIndex) => (
          <CompletionLine index={index} itemIndex={itemIndex} label={item.label || `Item ${itemIndex + 1}: ___`} key={itemIndex} />
        ))}
      </fieldset>
    );
  }

  return (
    <label className="question" id={`question-${index + 1}`}>
      <strong>{index + 1}. {question.question}</strong>
      <Input name={`q_${index}`} placeholder="Your answer" />
    </label>
  );
}

function CompletionLine({ index, itemIndex, label }: { index: number; itemIndex: number; label: string }) {
  const parts = label.includes("___") ? label.split("___") : label.split("[blank]");
  if (parts.length < 2) {
    return (
      <label className="completion-line">
        <span>{label}</span>
        <Input name={`q_${index}_${itemIndex}`} placeholder="Answer" />
      </label>
    );
  }
  return (
    <label className="completion-line completion-inline">
      <span>{parts[0]}</span>
      <Input name={`q_${index}_${itemIndex}`} placeholder={`${itemIndex + 1}`} />
      <span>{parts.slice(1).join("___")}</span>
    </label>
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
