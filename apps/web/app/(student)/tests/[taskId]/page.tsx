import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, EmptyState, Input, QuestionNavigator } from "@ielts-pro/ui";
import { buildRenderableQuestions, createServerSupabaseClient, getPublishedTaskByIdForStudent, getSubmissionForTask, getTaskAudioUrl, parseTaskContent, sanitizeTeacherHtml, type Question, type Task, type TaskContent } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../../components/StudentShell";
import { WritingAnswerBox } from "../../components/WritingAnswerBox";
import { FullscreenButton } from "./FullscreenButton";
import { TestTimer } from "./TestTimer";
import { TestStarter } from "./TestStarter";
import { TestSubmitWrapper } from "./TestSubmitWrapper";
import { HtmlTestListener } from "./HtmlTestListener";
import { HtmlTestContent } from "./HtmlTestContent";

export default async function TestPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [task, existingSubmission] = await Promise.all([
    getPublishedTaskByIdForStudent(supabase, taskId),
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
  var TEST_STARTED_AT = Date.now();
  console.log('[bridge] loaded, TASK_ID =', TASK_ID);

  function extractResultsFromDOM() {
    var byIndex = {};

    function ensureQ(n) {
      if (!byIndex[n]) byIndex[n] = { question: n, correct: null, yourAnswer: '', correctAnswer: '' };
      return byIndex[n];
    }

    function tryCorrect(q, isCorrect, correctAnswer) {
      var r = ensureQ(q);
      if (isCorrect !== null && r.correct === null) r.correct = isCorrect;
      if (correctAnswer && !r.correctAnswer) r.correctAnswer = correctAnswer;
    }

    var radioGroups = {};
    document.querySelectorAll('input[type="radio"]').forEach(function(input) {
      var name = input.getAttribute('name') || '';
      if (!name) return;
      if (!radioGroups[name]) radioGroups[name] = [];
      radioGroups[name].push(input);
    });
    var radioNames = Object.keys(radioGroups);
    radioNames.forEach(function(name, i) {
      var inputs = radioGroups[name];
      var checked = null;
      inputs.forEach(function(inp) { if (inp.checked) checked = inp; });
      var value = checked ? (checked.getAttribute('value') || '') : '';
      var q = i + 1;
      var r = ensureQ(q);
      r.yourAnswer = value;
      var questionEl = (checked || inputs[0]).closest('[data-answer]') || (checked || inputs[0]).closest('.question') || (checked || inputs[0]).closest('fieldset');
      if (questionEl) {
        var answerAttr = questionEl.getAttribute('data-answer') || questionEl.getAttribute('data-correct');
        if (answerAttr) {
          r.correctAnswer = answerAttr;
          if (value) r.correct = value.toUpperCase() === answerAttr.toUpperCase();
        }
        var correctEl = questionEl.querySelector('[data-correct-answer], .correct-answer, .answer-key');
        if (correctEl) {
          var ca = (correctEl.textContent || '').trim();
          if (ca) r.correctAnswer = r.correctAnswer || ca;
          if (r.correct === null && value && r.correctAnswer) r.correct = value.toUpperCase() === r.correctAnswer.toUpperCase();
        }
      }
    });

    var textInputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
    textInputs.forEach(function(input, i) {
      var value = (input.value || '').trim();
      var q = i + 1;
      var r = ensureQ(q);
      if (value && !r.yourAnswer) r.yourAnswer = value;
      var questionEl = input.closest('[data-answer]') || input.closest('.question') || input.closest('label');
      if (questionEl) {
        var answerAttr = questionEl.getAttribute('data-answer') || questionEl.getAttribute('data-correct');
        if (answerAttr) {
          r.correctAnswer = r.correctAnswer || answerAttr;
          if (value && r.correct === null) r.correct = value.toLowerCase() === answerAttr.toLowerCase();
        }
        var correctEl = questionEl.querySelector('[data-correct-answer], .correct-answer, .answer-key');
        if (correctEl) {
          var ca = (correctEl.textContent || '').trim();
          if (ca) r.correctAnswer = r.correctAnswer || ca;
          if (r.correct === null && value && r.correctAnswer) r.correct = value.toLowerCase() === r.correctAnswer.toLowerCase();
        }
      }
    });

    var answerEls = document.querySelectorAll('[data-question-index]');
    answerEls.forEach(function(el) {
      var idx = parseInt(el.getAttribute('data-question-index'), 10);
      if (isNaN(idx)) return;
      var q = idx + 1;
      var isCorrect = el.classList.contains('correct') || el.classList.contains('is-correct') || el.getAttribute('data-correct') === 'true';
      var isWrong = el.classList.contains('incorrect') || el.classList.contains('wrong') || el.classList.contains('is-wrong') || el.getAttribute('data-correct') === 'false';
      var yourEl = el.querySelector('[data-your-answer]') || el.querySelector('.your-answer');
      var rightEl = el.querySelector('[data-correct-answer]') || el.querySelector('.correct-answer');
      var r = ensureQ(q);
      if (yourEl) {
        var ya = (yourEl.textContent || '').trim();
        if (ya && !r.yourAnswer) r.yourAnswer = ya;
      }
      if (rightEl) {
        var ra = (rightEl.textContent || '').trim();
        if (ra) r.correctAnswer = r.correctAnswer || ra;
      }
      tryCorrect(q, isCorrect ? true : isWrong ? false : null, null);
    });

    var rows = document.querySelectorAll('tr[data-result], .result-row, .question-result');
    rows.forEach(function(row, i) {
      var q = i + 1;
      var isCorrect = row.classList.contains('correct') || row.classList.contains('is-correct') || row.querySelector('.tick, .correct-icon, .result-correct') != null;
      var isWrong = row.classList.contains('incorrect') || row.classList.contains('wrong') || row.querySelector('.cross, .wrong-icon, .result-incorrect') != null;
      tryCorrect(q, isCorrect ? true : isWrong ? false : null, null);
    });

    var summaryEl = document.getElementById('result-details') || document.getElementById('results-detail');
    if (summaryEl) {
      summaryEl.querySelectorAll('li, .result-item, tr').forEach(function(item, i) {
        var q = i + 1;
        var text = (item.textContent || '').toLowerCase();
        var isCorrect = text.indexOf('correct') >= 0 || item.classList.contains('correct');
        var isWrong = text.indexOf('incorrect') >= 0 || text.indexOf('wrong') >= 0 || item.classList.contains('wrong');
        tryCorrect(q, isCorrect && !isWrong ? true : isWrong ? false : null, null);
      });
    }

    var keys = Object.keys(byIndex).map(Number).sort(function(a, b) { return a - b; });
    if (!keys.length) return null;
    return keys.map(function(k) { return byIndex[k]; });
  }

  window.submitIeltsScore = window.submitIeltsScore || async function(result){
    console.log('[bridge] submitIeltsScore called with', result);
    result = result || {};
    var score = result.score, total = result.total;
    var results = result.results || extractResultsFromDOM();
    var timeTaken = Math.round((Date.now() - TEST_STARTED_AT) / 1000);
    window.__ielts_submitted = true;
    window.dispatchEvent(new CustomEvent('test-completed', { detail: { score: score, total: total, results: results, timeTaken: timeTaken } }));
    try {
      await fetch('/api/html-attempts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskId: TASK_ID, score: score, total: total, answers: result.answers || null, results: results, timeTaken: timeTaken })
      });
    } catch (err) {
      console.error('submitIeltsScore save failed', err);
    }
  };

  var origCheckAnswers = window.checkAnswers;
  if (typeof origCheckAnswers === 'function') {
    window.checkAnswers = function() {
      console.log('[bridge] checkAnswers called');
      origCheckAnswers();
      console.log('[bridge] done, submitted=', !!window.__ielts_submitted);
      if (!window.__ielts_submitted && typeof window.submitIeltsScore === 'function') {
        var statsEl = document.getElementById('result-stats');
        var score = 0, total = 0;
        if (statsEl) {
          var strong = statsEl.querySelector('.stat-box strong');
          if (strong) {
            var parts = (strong.textContent || '').split('/');
            score = parseInt(parts[0], 10) || 0;
            total = parseInt(parts[1], 10) || 0;
          }
        }
        var results = extractResultsFromDOM();
        console.log('[bridge] forcing submitIeltsScore with', score, '/', total, 'results=', results ? results.length : 0);
        window.submitIeltsScore({ score: score, total: total, results: results });
      }
    };
  } else {
    console.log('[bridge] checkAnswers not found on window');
  }
})();
</script>`;
      htmlTest = rawHtml.includes("</body>")
        ? rawHtml.replace("</body>", `${bridge}</body>`)
        : `${rawHtml}${bridge}`;
    }

    const skillLabel = labelFor(task.skill);
    const htmlContent = parseTaskContent<TaskContent>(task.content, { questions: [] });
    const audioUrl = getTaskAudioUrl(htmlContent, task);
    return (
      <StudentShell name={session.name} variant="test">
        <main className="test-page html-test" id="test-content">
          <div className="exam-topline">
            <div>
              <Badge tone={toneFor(task.skill)}>{skillLabel}</Badge>
            </div>
            <div className="topline-actions">
              {existingSubmission?.score != null ? (
                <span className="submission-score">Score: {existingSubmission.score}/{existingSubmission.total ?? "?"}</span>
              ) : null}
              <FullscreenButton />
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
          ) : (
            <TestStarter title={task.title} skillLabel={skillLabel}>
              <div className="exam-status-strip">
                <span>{defaultTimeForSkill(task.skill)} minutes</span>
                <TestTimer minutes={defaultTimeForSkill(task.skill)} />
                <span>Auto checked</span>
              </div>
              {audioUrl ? (
                <audio controls autoPlay preload="auto" src={audioUrl} className="audio-player" />
              ) : null}
              {!htmlTest ? (
                <div className="html-test-viewer-status">
                  <p className="form-error">Test file is missing. Ask your teacher to re-upload it.</p>
                </div>
              ) : (
                <HtmlTestContent html={htmlTest} taskId={task.id} />
              )}
            </TestStarter>
          )}
          <HtmlTestListener skill={task.skill} title={task.title} />
        </main>
      </StudentShell>
    );
  }

  const content = parseTaskContent<TaskContent>(task.content, { questions: [] });
  const questions = buildRenderableQuestions(content, task);
  const questionRows = buildQuestionRows(questions);
  const audioUrl = getTaskAudioUrl(content, task);
  const questionCount = questions.length;
  const answerCount = questionRows.reduce((total, row) => total + row.answerCount, 0);
  const isFullTest = task.skill === "full_test";
  const timeLimitMinutes = Number(content.time_limit_minutes || content.duration_minutes || defaultTimeForSkill(task.skill));

  return (
    <StudentShell name={session.name} variant="test">
      <main className="test-page" id="test-content">
        <div className="exam-topline">
          <div>
            <Badge tone={toneFor(task.skill)}>{labelFor(task.skill)}</Badge>
            <h1>{task.title}</h1>
          </div>
          <div className="topline-actions">
            <FullscreenButton />
            <Link href="/practice" className="btn btn-secondary">Exit test</Link>
          </div>
        </div>

        {existingSubmission ? (
          <Card className="submitted-panel">
            <div>
              <Badge tone="success">Submitted</Badge>
              <h2>Your answer is saved</h2>
              <p>{existingSubmission.score != null ? `Score: ${existingSubmission.score}/${existingSubmission.total ?? "?"}` : "Writing submissions wait for teacher review."}</p>
              {existingSubmission.feedback ? <p><strong>Teacher feedback:</strong> {existingSubmission.feedback}</p> : null}
            </div>
            <Link href="/results" className="btn btn-primary">View results</Link>
          </Card>
        ) : (
          <TestStarter title={task.title} skillLabel={labelFor(task.skill)} instructions={content.instructions} timeLimitMinutes={timeLimitMinutes}>
            <div className="exam-status-strip">
              <span>{answerCount || (task.skill === "writing" ? 1 : 0)} {task.skill === "writing" ? "task" : "answers"}</span>
              <TestTimer minutes={timeLimitMinutes} />
              <span>{task.skill === "writing" ? "Teacher reviewed" : "Auto checked"}</span>
            </div>
            <TestSubmitWrapper taskId={task.id} skill={task.skill} title={task.title}>
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
<audio controls autoPlay preload="auto" src={audioUrl} className="audio-player" data-testid="audio-player" />
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
                    <h2>{task.skill === "writing" ? "Your response" : `${answerCount} answer${answerCount === 1 ? "" : "s"}`}</h2>
                    {questionCount > 0 && answerCount !== questionCount ? <p className="muted">{questionCount} imported question group{questionCount === 1 ? "" : "s"}</p> : null}
                  </div>
                  {timeLimitMinutes ? <Badge tone="warning">{timeLimitMinutes} min</Badge> : null}
                </div>
                {task.skill === "writing" ? (
                  <WritingAnswerBox name="writing_answer" label="Your response" placeholder="Write your IELTS response here..." minWords={content.min_words} required />
                ) : (
                  <>
                    {questionRows.length ? questionRows.map((row) => <QuestionInput question={row.question} index={row.index} firstAnswerNumber={row.firstAnswerNumber} key={row.index} />) : (
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
              </section>
              <aside className="card test-aside">
                <h3>Question navigator</h3>
                <QuestionNavigator count={answerCount} />
                <p className="muted">Use the numbers to jump through the task. Review your answers before submitting.</p>
              </aside>
            </TestSubmitWrapper>
          </TestStarter>
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
          {audioUrl ? <audio controls autoPlay preload="auto" src={audioUrl} className="audio-player" data-testid="audio-player" /> : <p className="form-error">No listening audio was found in this import.</p>}
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

function defaultTimeForSkill(skill: string) {
  if (skill === "listening") return 30;
  if (skill === "reading") return 60;
  if (skill === "writing") return 60;
  if (skill === "full_test") return 180;
  return 60;
}

function buildQuestionRows(questions: Question[]) {
  let offset = 0;
  return questions.map((question, index) => {
    const answerCount = countAnswerFields(question);
    const row = {
      question,
      index,
      answerCount,
      firstAnswerNumber: offset + 1
    };
    offset += answerCount;
    return row;
  });
}

function countAnswerFields(question: Question) {
  if (question.items?.length) return question.items.length;
  if (question.type === "mcq_multi" && Array.isArray(question.answer) && question.answer.length > 1) return question.answer.length;
  return 1;
}

function QuestionInput({ question, index, firstAnswerNumber }: { question: Question; index: number; firstAnswerNumber: number }) {
  if (question.options?.length) {
    const multiple = question.type === "mcq_multi";
    return (
      <fieldset className="question" id={`question-${firstAnswerNumber}`}>
        <legend><strong>{firstAnswerNumber}. {question.question}</strong></legend>
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
    const lastAnswerNumber = firstAnswerNumber + question.items.length - 1;
    return (
      <fieldset className="question" id={`question-group-${index + 1}`}>
        <legend><strong>Questions {firstAnswerNumber}{lastAnswerNumber > firstAnswerNumber ? `-${lastAnswerNumber}` : ""}. {question.question || "Complete the items"}</strong></legend>
        {question.items.map((item, itemIndex) => (
          <CompletionLine
            index={index}
            itemIndex={itemIndex}
            label={item.label || `Item ${firstAnswerNumber + itemIndex}: ___`}
            number={firstAnswerNumber + itemIndex}
            key={itemIndex}
          />
        ))}
      </fieldset>
    );
  }

  return (
    <label className="question" id={`question-${firstAnswerNumber}`}>
      <strong>{firstAnswerNumber}. {question.question}</strong>
      <Input name={`q_${index}`} placeholder="Your answer" />
    </label>
  );
}

function CompletionLine({ index, itemIndex, label, number }: { index: number; itemIndex: number; label: string; number: number }) {
  const parts = label.includes("___") ? label.split("___") : label.split("[blank]");
  if (parts.length < 2) {
    return (
      <label className="completion-line" id={`question-${number}`}>
        <span>{label}</span>
        <Input name={`q_${index}_${itemIndex}`} placeholder="Answer" aria-label={`Question ${number}`} />
      </label>
    );
  }
  return (
    <label className="completion-line completion-inline" id={`question-${number}`}>
      <span>{parts[0]}</span>
      <Input name={`q_${index}_${itemIndex}`} placeholder={`${number}`} aria-label={`Question ${number}`} />
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
