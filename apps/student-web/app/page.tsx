"use client";

import { useActionState } from "react";
import { Button, Card, Input } from "@ielts-pro/ui";
import { studentLogin } from "./actions/auth";

export default function StudentLoginPage() {
  const [state, action, pending] = useActionState(studentLogin, undefined);
  return (
    <main className="login-screen">
      <section className="login-hero">
        <p className="eyebrow">IELTS Pro</p>
        <h1>Practice room for serious IELTS progress.</h1>
        <p>
          See assigned tests, complete reading and listening work, submit writing, and track teacher feedback from one clean dashboard.
        </p>
      </section>
      <Card className="login-card">
        <h2>Student Login</h2>
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
          <Button disabled={pending}>{pending ? "Checking..." : "Open Dashboard"}</Button>
        </form>
      </Card>
    </main>
  );
}
