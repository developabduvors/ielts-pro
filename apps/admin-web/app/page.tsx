"use client";

import { useActionState } from "react";
import { Button, Card, Input } from "@ielts-pro/ui";
import { adminLogin } from "./actions/auth";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  return (
    <main className="admin-login">
      <Card className="admin-login-card">
        <p className="eyebrow">Teacher workspace</p>
        <h1>Manage IELTS Pro</h1>
        <p className="muted">Create lessons, publish tests, and review writing submissions.</p>
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
          <Button disabled={pending}>{pending ? "Signing in..." : "Open Admin"}</Button>
        </form>
      </Card>
    </main>
  );
}
