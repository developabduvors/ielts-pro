"use client";

import { useActionState } from "react";
import Link from "next/link";
import { adminLogin } from "./actions/auth";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  const studentBase = process.env.NEXT_PUBLIC_STUDENT_APP_URL || "https://ielts-pro-student-web.vercel.app";
  const studentUrl = `${studentBase.replace(/\/$/, "")}/login`;

  return (
    <main className="admin-login-page">
      <section className="admin-login-form-panel">
        <Link className="admin-login-back" href={studentUrl} aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M20 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <div className="admin-login-copy">
          <h1>Login</h1>
          <span>Login <em>via your personal Id</em></span>
        </div>

        <form action={action} className="admin-login-form">
          <p className="admin-login-role">Admin</p>
          <label className="admin-line-field">
            <span className="sr-only">Admin Email</span>
            <input name="email" type="email" autoComplete="email" spellCheck={false} placeholder="Full Name" required />
          </label>
          <label className="admin-line-field">
            <span className="sr-only">Password</span>
            <input name="password" type="password" autoComplete="current-password" placeholder="Personal ID" required />
          </label>
          {state?.error ? <p className="form-error">{state.error}</p> : null}
          <button className="admin-login-next" disabled={pending}>{pending ? "Signing in..." : "Next"}</button>
        </form>

        <p className="admin-login-help">You can find your ID from <a href="mailto:support@ielts-pro.com">support</a>!</p>
        <Link className="admin-login-student" href={studentUrl}>
          Student
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </section>

      <section className="admin-login-visual" aria-label="IELTS Pro">
        <div className="admin-login-badge">
          IELTS <span>PRO</span>
        </div>
      </section>
    </main>
  );
}
