import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, EmptyState, Input, Textarea } from "@ielts-pro/ui";
import { createServerSupabaseClient, getPublishedTaskById, getSubmissionForTask, parseTaskContent, sanitizeTeacherHtml, type Question, type TaskContent } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { submitTaskAttempt } from "../../actions/attempts";

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

  return (
    <main className="page">
      <div className="section-head">
        <div>
          <p className="eyebrow">{task.skill} practice</p>
          <h1>{task.title}</h1>
        </div>
        <Link href="/dashboard" className="btn btn-secondary">Back</Link>
      </div>

      {existingSubmission ? (
        <Card className="test-card">
          <div>
            <Badge tone="success">Submitted</Badge>
            <h3>Your answer is saved</h3>
            <p>{existingSubmission.score != null ? `Score: ${existingSubmission.score}/${existingSubmission.total ?? "?"}` : "Writing submissions wait for teacher review."}</p>
            {existingSubmission.feedback ? <p><strong>Teacher feedback:</strong> {existingSubmission.feedback}</p> : null}
          </div>
          <Link href="/progress" className="btn btn-primary">View Progress</Link>
        </Card>
      ) : (
        <form action={submitTaskAttempt} className="test-layout">
          <input type="hidden" name="taskId" value={task.id} />
          <section className="card passage">
            {task.skill === "writing" ? (
              <>
                <Badge tone="writing">Writing</Badge>
                <h2>Prompt</h2>
                <p>{content.prompt || "Write your answer for this task."}</p>
                {content.time_limit_minutes ? <p className="muted">Suggested time: {content.time_limit_minutes} minutes</p> : null}
              </>
            ) : task.skill === "listening" ? (
              <>
                <Badge tone="listening">Listening</Badge>
                <h2>Audio</h2>
                <p>{content.instructions || "Listen and answer the questions."}</p>
                {content.audio_url ? <audio controls src={content.audio_url} style={{ width: "100%" }} /> : <p className="form-error">No audio file is attached.</p>}
              </>
            ) : (
              <>
                <Badge tone="reading">Reading</Badge>
                <h2>Passage</h2>
                <div dangerouslySetInnerHTML={{ __html: sanitizeTeacherHtml(content.passage_html || content.passages?.[0]?.html || "") }} />
              </>
            )}
          </section>
          <section className="card question-panel">
            {task.skill === "writing" ? (
              <label>
                Your Response
                <Textarea name="writing_answer" placeholder="Write your IELTS response here..." required />
              </label>
            ) : content.questions?.length ? content.questions.map((question, index) => <QuestionInput question={question} index={index} key={index} />) : <EmptyState title="No questions" body="This task has no questions yet." />}
            <Button type="submit">Submit Answers</Button>
          </section>
          <aside className="card test-aside">
            <h3>Before You Submit</h3>
            <p className="muted">Check unanswered questions. Submitted attempts are saved for your teacher.</p>
            {content.time_limit_minutes ? <Badge tone="warning">{content.time_limit_minutes} min</Badge> : null}
          </aside>
        </form>
      )}
    </main>
  );
}

function QuestionInput({ question, index }: { question: Question; index: number }) {
  if (question.options?.length) {
    const multiple = question.type === "mcq_multi";
    return (
      <fieldset className="question">
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
      <fieldset className="question">
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
    <label className="question">
      <strong>{index + 1}. {question.question}</strong>
      <Input name={`q_${index}`} placeholder="Your answer" />
    </label>
  );
}
