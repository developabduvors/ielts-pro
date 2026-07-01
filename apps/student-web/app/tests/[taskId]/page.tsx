import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, EmptyState, Input, QuestionNavigator, Textarea } from "@ielts-pro/ui";
import { createServerSupabaseClient, getPublishedTaskById, getSubmissionForTask, parseTaskContent, sanitizeTeacherHtml, type Question, type TaskContent } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { submitTaskAttempt } from "../../actions/attempts";
import { StudentShell } from "../../components/StudentShell";

export default async function TestPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [task, existingSubmission] = await Promise.all([
    getPublishedTaskById(supabase, taskId),
    getSubmissionForTask(supabase, session.id, taskId)
  ]);
  if (!task) notFound();
  const content = parseTaskContent<TaskContent>(task.content, { questions: [] });
  const questionCount = content.questions?.length || 0;

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
            <section className="card passage">
              {task.skill === "writing" ? (
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
                  {content.audio_url ? <audio controls src={content.audio_url} className="audio-player" /> : <p className="form-error">No audio file is attached.</p>}
                </>
              ) : (
                <>
                  <p className="eyebrow">Reading passage</p>
                  <h2>Passage</h2>
                  <div className="passage-content" dangerouslySetInnerHTML={{ __html: sanitizeTeacherHtml(content.passage_html || content.passages?.[0]?.html || "") }} />
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
                <label className="writing-box">
                  Your response
                <Textarea name="writing_answer" placeholder="Write your IELTS response here…" required />
                </label>
              ) : content.questions?.length ? content.questions.map((question, index) => <QuestionInput question={question} index={index} key={index} />) : <EmptyState title="No questions" body="This task has no questions yet." />}
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
          <label key={itemIndex}>
            {item.label || `Item ${itemIndex + 1}`}
            <Input name={`q_${index}_${itemIndex}`} placeholder="Your answer" />
          </label>
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
