"use client";

import { scoreToBand } from "@ielts-pro/shared";

type PerQuestionDetail = {
  questionIndex: number;
  isCorrect: boolean | null;
  your: string;
  right: string;
};

type SubmissionDetail = {
  id: string;
  taskTitle: string;
  skill: string;
  score: number | null;
  total: number | null;
  timeTaken: number | null;
  submittedAt: string;
  answer: string | null;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function labelFor(skill: string) {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  if (skill === "writing") return "Writing";
  if (skill === "full_test") return "Full Test";
  return skill;
}

function qLabel(d: PerQuestionDetail): string {
  return `Q${d.questionIndex + 1}`;
}

function parseSubmissionAnswer(answer: string | null): { answers: Record<string, unknown>; results: Array<{ question: number; correct: boolean | null; yourAnswer: string; correctAnswer: string }> } {
  if (!answer) return { answers: {}, results: [] };
  try {
    const parsed = JSON.parse(answer);
    if (parsed && typeof parsed === "object" && "answers" in parsed) {
      return {
        answers: parsed.answers || {},
        results: Array.isArray(parsed.results) ? parsed.results : []
      };
    }
    return { answers: parsed || {}, results: [] };
  } catch {
    return { answers: {}, results: [] };
  }
}

export function SubmissionDetailModal({
  submission,
  onClose,
}: {
  submission: SubmissionDetail;
  onClose: () => void;
}) {
  const { results } = parseSubmissionAnswer(submission.answer);
  const score = submission.score ?? 0;
  const total = submission.total ?? 0;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const bandScore = scoreToBand(submission.skill, score, total);

  const mapped = results.map((r) => ({
    questionIndex: r.question - 1,
    isCorrect: r.correct === null || r.correct === undefined ? null : r.correct,
    your: r.yourAnswer || "",
    right: r.correctAnswer || "",
  }));
  const maxQ = Math.max(...mapped.map((m) => m.questionIndex), (total > 0 ? total : 0) - 1);
  const byIndex = new Map(mapped.map((m) => [m.questionIndex, m]));
  const perQuestion: PerQuestionDetail[] = [];
  for (let i = 0; i <= maxQ; i++) {
    perQuestion.push(byIndex.get(i) || { questionIndex: i, isCorrect: null, your: "", right: "" });
  }

  const hasBreakdown = perQuestion.length > 0;

  return (
    <div className="result-modal-backdrop" onClick={onClose}>
      <div className="result-modal" onClick={(e) => e.stopPropagation()}>
        <div className="result-modal-header">
          <span className="result-modal-skill">{labelFor(submission.skill)}</span>
          <h2>Answer Analysis</h2>
          <p className="result-modal-title">{submission.taskTitle}</p>
        </div>

        <div className="result-modal-body">
          <div className="result-band">
            <span className="result-band-label">Band score</span>
            <span className="result-band-value">{bandScore != null ? bandScore.toFixed(1) : "-"}</span>
          </div>

          <div className="result-stats-grid">
            <div className="result-stat">
              <span className="result-stat-value">{score}/{total}</span>
              <span className="result-stat-label">Correct</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-value">{pct}%</span>
              <span className="result-stat-label">Accuracy</span>
            </div>
            {submission.timeTaken ? (
              <div className="result-stat">
                <span className="result-stat-value">{formatTime(submission.timeTaken)}</span>
                <span className="result-stat-label">Time taken</span>
              </div>
            ) : null}
          </div>

          <div className="result-analysis">
            <h3>Analysis</h3>
            <div className="result-analysis-bar-wrap">
              <div className="result-analysis-bar">
                <div className="result-analysis-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="result-analysis-labels">
                <span>Correct: {score}</span>
                <span>Incorrect: {total - score}</span>
              </div>
            </div>
          </div>

          <div className="result-breakdown">
            <h3>Answer breakdown</h3>
            {hasBreakdown ? (
              <div className="result-breakdown-table-wrap">
                <table className="result-breakdown-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Your answer</th>
                      <th>Correct answer</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perQuestion.map((d, i) => (
                      <tr key={i} className={d.isCorrect === null ? "row-empty" : d.isCorrect ? "row-correct" : "row-wrong"}>
                        <td className="cell-label">{qLabel(d)}</td>
                        <td className="cell-answer">{d.your || "\u2014"}</td>
                        <td className="cell-answer">{d.right}</td>
                        <td className="cell-result">
                          {d.isCorrect === null ? (
                            <span className="result-dash">\u2014</span>
                          ) : d.isCorrect ? (
                            <span className="result-tick">&#10003;</span>
                          ) : (
                            <span className="result-cross">&#10007;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="result-breakdown-empty">
                No per-question breakdown available for this submission. Detailed breakdown is available immediately after completing HTML tests.
              </p>
            )}
          </div>
        </div>

        <div className="result-modal-actions">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
