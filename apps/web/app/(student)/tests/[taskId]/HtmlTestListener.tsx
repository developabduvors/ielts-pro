"use client";

import { useEffect, useRef, useState } from "react";
import { TestResultModal, calculateBandScore, type SubmitResult, type PerQuestionDetail } from "./TestResultModal";

export function HtmlTestListener({
  skill,
  title,
}: {
  skill: string;
  title: string;
}) {
  const [result, setResult] = useState<SubmitResult | null>(null);
  const testStartedAt = useRef(Date.now());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const { score, total, results, timeTaken: rawTimeTaken } = detail;
      if (score == null) return;
      const timeTaken = typeof rawTimeTaken === "number" && rawTimeTaken > 0
        ? rawTimeTaken
        : Math.round((Date.now() - testStartedAt.current) / 1000);
      let perQuestion: PerQuestionDetail[] | undefined;
      if (Array.isArray(results) && results.length) {
        const mapped = results.map((r: { question: number; correct: boolean | null; yourAnswer: string; correctAnswer: string }) => ({
          questionIndex: r.question - 1,
          isCorrect: r.correct === null || r.correct === undefined ? null : r.correct,
          your: r.yourAnswer || "",
          right: r.correctAnswer || "",
        }));
        const maxQ = Math.max(...mapped.map((m) => m.questionIndex), (typeof total === "number" && total > 0 ? total : 0) - 1);
        const byIndex = new Map(mapped.map((m) => [m.questionIndex, m]));
        perQuestion = [];
        for (let i = 0; i <= maxQ; i++) {
          perQuestion.push(byIndex.get(i) || { questionIndex: i, isCorrect: null, your: "", right: "" });
        }
      }
      setResult({
        status: "success",
        score,
        total,
        timeTaken,
        bandScore: calculateBandScore(score, total, skill),
        skill,
        title,
        perQuestion,
      });
    };
    window.addEventListener("test-completed", handler);
    return () => window.removeEventListener("test-completed", handler);
  }, [skill, title]);

  if (!result) return null;

  return (
    <TestResultModal
      result={result}
      onClose={() => { window.location.href = "/practice"; }}
    />
  );
}
