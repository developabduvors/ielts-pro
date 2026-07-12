"use client";

import { useRef, useState } from "react";
import { Button } from "@ielts-pro/ui";
import { submitTaskAttempt } from "../../actions/attempts";
import { TestResultModal, calculateBandScore, type SubmitResult } from "./TestResultModal";
import { useTestStart } from "./TestStarter";

export function TestSubmitWrapper({
  children,
  taskId,
  skill,
  title,
}: {
  children: React.ReactNode;
  taskId: string;
  skill: string;
  title: string;
}) {
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startCtx = useTestStart();
  const startTime = useRef(startCtx?.testStartedAt || Date.now());

  const handleSubmit = async (formData: FormData) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      formData.set("taskId", taskId);
      formData.set("timeTaken", String(Math.round((Date.now() - startTime.current) / 1000)));
      const res = await submitTaskAttempt(formData);
      if (res.redirect) {
        window.location.href = res.redirect;
        return;
      }
      if (res.ok && res.score != null && res.total != null) {
        const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
        setResult({
          status: "success",
          score: res.score,
          total: res.total,
          timeTaken,
          bandScore: calculateBandScore(res.score, res.total, skill),
          skill,
          title,
          perQuestion: res.details,
        });
      }
    } catch (err) {
      console.error("[TestSubmitWrapper] submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {result && (
        <TestResultModal
          result={result}
          onClose={() => window.location.href = "/practice"}
        />
      )}
      <form action={handleSubmit} className="exam-layout" id="test-answer-form" data-testid="test-answer-form">
        <input type="hidden" name="taskId" value={taskId} />
        {children}
        <Button type="submit" data-testid="submit-answers-button" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit answers"}
        </Button>
      </form>
    </>
  );
}
