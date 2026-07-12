"use client";

import { useState } from "react";
import Link from "next/link";
import { scoreToBand } from "@ielts-pro/shared";
import { formatDate, formatTimeTaken, labelForSkill, toneForSkill } from "../student-utils";
import { SubmissionDetailModal } from "./SubmissionDetailModal";

type SubmissionRow = {
  id: string;
  score: number | null;
  total: number | null;
  time_taken: number | null;
  submitted_at: string;
  answer: string | null;
  tasks?: { title: string; skill: string } | null;
};

export function HistoryTable({ submissions }: { submissions: SubmissionRow[] }) {
  const [selected, setSelected] = useState<SubmissionRow | null>(null);

  if (!submissions.length) {
    return (
      <div className="student-empty-card">
        <h3>No attempts yet</h3>
        <p>Complete a Reading or Listening test to see your history here.</p>
        <Link className="student-secondary-button" href="/practice">Open practice</Link>
      </div>
    );
  }

  return (
    <>
      <div className="student-table-wrap">
        <table className="student-stats-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Test</th>
              <th>Type</th>
              <th>Score</th>
              <th>Band</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const skill = s.tasks?.skill || "";
              const bandVal = s.score != null && s.total ? scoreToBand(skill, Number(s.score), Number(s.total)) : null;
              const timeLabel = formatTimeTaken(s.time_taken);
              return (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ whiteSpace: "nowrap" }}>{formatDate(s.submitted_at, { dateStyle: "medium" })}</td>
                  <td>{s.tasks?.title || "Untitled"}</td>
                  <td><span className={`skill-badge tone-${toneForSkill(skill)}`}>{labelForSkill(skill)}</span></td>
                  <td><strong>{s.score}/{s.total}</strong></td>
                  <td>{bandVal != null ? bandVal.toFixed(1) : "-"}</td>
                  <td>{timeLabel || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected ? (
        <SubmissionDetailModal
          submission={{
            id: selected.id,
            taskTitle: selected.tasks?.title || "Untitled",
            skill: selected.tasks?.skill || "",
            score: selected.score,
            total: selected.total,
            timeTaken: selected.time_taken,
            submittedAt: selected.submitted_at,
            answer: selected.answer,
          }}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
