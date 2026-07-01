"use client";

import { useActionState } from "react";
import { Button, Card, Input } from "@ielts-pro/ui";
import { studentLogin } from "./actions/auth";

export default function StudentLoginPage() {
  const [state, action, pending] = useActionState(studentLogin, undefined);
  return (
    <main className="login-screen">
      <section className="login-hero">
        <p className="eyebrow">IELTS Pro student portal</p>
        <h1>Train each IELTS skill with a clear path to feedback.</h1>
        <p>
          Open teacher-published practice, complete Reading and Listening tasks, submit Writing responses, and follow your results from one focused workspace.
        </p>
        <div className="login-skill-strip" aria-label="IELTS skills">
          <span>Reading</span>
          <span>Listening</span>
          <span>Writing</span>
          <span>Full tests</span>
        </div>
        <div className="study-map" aria-hidden="true">
          <div className="study-map-head">
            <span>Band path</span>
            <strong>7.0+</strong>
          </div>
          <div className="study-row"><span>R</span><i /><b>Passage drills</b></div>
          <div className="study-row"><span>L</span><i /><b>Audio sections</b></div>
          <div className="study-row"><span>W</span><i /><b>Teacher feedback</b></div>
        </div>
      </section>
      <Card className="login-card">
        <p className="eyebrow">Assigned access</p>
        <h2>Student login</h2>
        <p className="muted">Use the name and student ID from your teacher.</p>
        <form action={action} className="form-stack">
          <label>
            Full Name
            <Input name="name" autoComplete="name" placeholder="Miravzal S" required />
          </label>
          <label>
            Student ID
            <Input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="1111111" required />
          </label>
          {state?.error ? <p className="form-error">{state.error}</p> : null}
          <Button disabled={pending}>{pending ? "Checking…" : "Open practice room"}</Button>
        </form>
      </Card>
    </main>
  );
}
