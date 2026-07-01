"use client";

import { Suspense } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@ielts-pro/ui";
import { studentLogin } from "./actions/auth";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<main className="login-screen" />}>
      <StudentLoginForm />
    </Suspense>
  );
}

function StudentLoginForm() {
  const [state, action, pending] = useActionState(studentLogin, undefined);
  const searchParams = useSearchParams();
  const sessionError = searchParams.get("error");
  return (
    <main className="login-screen">
      <section className="login-hero">
        <p className="eyebrow">Private IELTS Pro portal</p>
        <h1>Enter your teacher-issued IELTS workspace.</h1>
        <p>
          This is a closed learning portal. Access is created by your teacher, then protected with a private Student Access ID and device session checks.
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
        <p className="eyebrow">Teacher-issued access</p>
        <h2>Student access</h2>
        <p className="muted">Use your full name and Student Access ID. There is no public signup or free trial.</p>
        <form action={action} className="form-stack">
          <label>
            Full Name
            <Input name="name" autoComplete="name" placeholder="Miravzal S" required />
          </label>
          <label>
            Student Access ID
            <Input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="1111111" required />
          </label>
          {sessionError === "session-revoked" ? <p className="form-error">This device session was revoked or your access was closed. Contact your teacher.</p> : null}
          {sessionError === "session-expired" ? <p className="form-error">Your session expired. Enter your Student Access ID again.</p> : null}
          {sessionError === "access-setup" ? <p className="form-error">Student access setup is not finished yet. Ask the admin to apply the Supabase migration.</p> : null}
          {state?.error ? <p className="form-error">{state.error}</p> : null}
          <Button disabled={pending}>{pending ? "Checking..." : "Enter Student Portal"}</Button>
        </form>
      </Card>
    </main>
  );
}
