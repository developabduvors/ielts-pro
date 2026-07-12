"use client";

import { useState, useCallback, useRef, createContext, useContext } from "react";

type TestStartContext = {
  testStartedAt: number;
  timeLimitMinutes: number;
};
const TestStartCtx = createContext<TestStartContext | null>(null);
export function useTestStart() {
  return useContext(TestStartCtx);
}

export function TestStarter({
  children,
  title,
  skillLabel,
  instructions,
  timeLimitMinutes,
}: {
  children: React.ReactNode;
  title: string;
  skillLabel: string;
  instructions?: string;
  timeLimitMinutes?: number;
}) {
  const [started, setStarted] = useState(false);
  const testStartedAt = useRef(0);

  const handleStart = useCallback(() => {
    testStartedAt.current = Date.now();
    setStarted(true);
  }, []);

  if (!started) {
    return (
      <div className="test-starter">
        <div className="test-starter-card">
          <span className="test-starter-badge">{skillLabel}</span>
          <h1 className="test-starter-title">{title}</h1>
          {instructions && <p className="test-starter-instructions">{instructions}</p>}
          <div className="test-starter-meta">
            {timeLimitMinutes ? <span>Time limit: {timeLimitMinutes} minutes</span> : null}
          </div>
          <button className="btn btn-primary test-starter-btn" onClick={handleStart} type="button">
            Start test
          </button>
        </div>
      </div>
    );
  }

  return (
    <TestStartCtx.Provider value={{ testStartedAt: testStartedAt.current, timeLimitMinutes: timeLimitMinutes || 60 }}>
      {children}
    </TestStartCtx.Provider>
  );
}
