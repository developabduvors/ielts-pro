"use client";

import { useActionState } from "react";
import { Button, Card, Input } from "@ielts-pro/ui";
import { adminLogin } from "./actions/auth";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  return (
    <main className="admin-login">
      <Card className="admin-login-card">
        <p className="eyebrow">Teacher workspace</p>
        <h1>Run the IELTS classroom</h1>
        <p className="muted">Publish practice, monitor students, and review writing from one protected admin panel.</p>
        <form action={action} className="form-stack">
          <label>
            Admin Email
            <Input name="email" type="email" autoComplete="email" spellCheck={false} required />
          </label>
          <label>
            Password
            <Input name="password" type="password" autoComplete="current-password" required />
          </label>
          {state?.error ? <p className="form-error">{state.error}</p> : null}
          <Button disabled={pending}>{pending ? "Signing in..." : "Open teacher panel"}</Button>
        </form>
      </Card>
    </main>
  );
}
