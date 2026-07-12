"use client";

import { scoreToBand } from "@ielts-pro/shared";

export type PerQuestionDetail = {
  questionIndex: number;
  subIndex?: number;
  isCorrect: boolean | null;
  your: string;
  right: string;
};

export type SubmitResult = {
  status: "success";
  score: number;
  total: number;
  timeTaken: number;
  bandScore: number;
  skill: string;
  title: string;
  perQuestion?: PerQuestionDetail[];
};

function labelFor(skill: string) {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  if (skill === "writing") return "Writing";
  if (skill === "full_test") return "Full Test";
  return skill;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function calculateBandScore(score: number, total: number, skill?: string) {
  const band = scoreToBand(skill || "", score, total);
  if (band != null) return band;
  if (total <= 0) return 0;
  const pct = (score / total) * 100;
  if (pct >= 99) return 9;
  if (pct >= 92) return 8.5;
  if (pct >= 85) return 8;
  if (pct >= 77) return 7.5;
  if (pct >= 70) return 7;
  if (pct >= 62) return 6.5;
  if (pct >= 55) return 6;
  if (pct >= 47) return 5.5;
  if (pct >= 40) return 5;
  if (pct >= 33) return 4.5;
  if (pct >= 25) return 4;
  if (pct >= 17) return 3.5;
  if (pct >= 10) return 3;
  return 2;
}

function qLabel(d: PerQuestionDetail): string {
  const n = d.questionIndex + 1;
  return d.subIndex != null ? `Q${n}${String.fromCharCode(97 + d.subIndex)}` : `Q${n}`;
}

export function TestResultModal({
  result,
  onClose,
}: {
  result: SubmitResult;
  onClose: () => void;
}) {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const perQuestion = result.perQuestion || [];
  const hasBreakdown = perQuestion.length > 0;

  return (
    <div className="result-modal-backdrop" onClick={onClose}>
      <div className="result-modal" onClick={(e) => e.stopPropagation()}>
        <div className="result-modal-header">
          <span className="result-modal-skill">{labelFor(result.skill)}</span>
          <h2>Test completed</h2>
          <p className="result-modal-title">{result.title}</p>
        </div>

        <div className="result-modal-body">
          <div className="result-band">
            <span className="result-band-label">Band score</span>
            <span className="result-band-value">{result.bandScore.toFixed(1)}</span>
          </div>

          <div className="result-stats-grid">
            <div className="result-stat">
              <span className="result-stat-value">{result.score}/{result.total}</span>
              <span className="result-stat-label">Correct</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-value">{pct}%</span>
              <span className="result-stat-label">Accuracy</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-value">{formatTime(result.timeTaken)}</span>
              <span className="result-stat-label">Time taken</span>
            </div>
          </div>

          <div className="result-analysis">
            <h3>Analysis</h3>
            <div className="result-analysis-bar-wrap">
              <div className="result-analysis-bar">
                <div className="result-analysis-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="result-analysis-labels">
                <span>Correct: {result.score}</span>
                <span>Incorrect: {result.total - result.score}</span>
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
                Detailed answer breakdown will appear here after submission.
                Your score and band are shown above.
              </p>
            )}
          </div>
        </div>

        <div className="result-modal-actions">
          <button className="btn btn-primary" onClick={() => { window.location.href = "/results"; }} type="button">
            View results
          </button>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
