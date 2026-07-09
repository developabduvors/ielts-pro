"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { studentLogin } from "../actions/auth";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<main className="student-login-page" />}>
      <StudentLoginForm />
    </Suspense>
  );
}

function StudentLoginForm() {
  const [state, action, pending] = useActionState(studentLogin, undefined);
  const searchParams = useSearchParams();
  const sessionError = searchParams.get("error");
  const adminUrl = "/admin";

  return (
    <main className="student-login-page">
      <section className="student-login-form-panel" aria-labelledby="student-login-title">
        <Link className="student-login-back" href="/" aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M20 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <div className="student-login-copy">
          <h1 id="student-login-title">Login</h1>
          <span>Login <em>via your personal Id</em></span>
        </div>

        <form action={action} className="student-login-form">
          <p className="student-login-role">Student</p>
          <label className="student-line-field">
            <span className="sr-only">Full Name</span>
            <input name="name" autoComplete="name" placeholder="Full Name" required />
          </label>
          <label className="student-line-field">
            <span className="sr-only">Personal ID</span>
            <input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="Personal ID" required />
          </label>
          {sessionError === "session-revoked" ? <p className="student-login-error">This device session was revoked or your access was closed. Contact your teacher.</p> : null}
          {sessionError === "session-expired" ? <p className="student-login-error">Your session expired. Enter your Student Access ID again.</p> : null}
          {sessionError === "access-setup" ? <p className="student-login-error">Student access setup is not finished yet. Apply the Supabase migration, then try again.</p> : null}
          {state?.error ? <p className="student-login-error">{state.error}</p> : null}
          <button className="student-login-next" disabled={pending}>{pending ? "Checking..." : "Next"}</button>
        </form>

        <p className="student-login-help">You can find your ID from your teacher !</p>
        <Link className="student-login-admin" href={adminUrl}>
          Admin
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </section>

      <section className="student-login-visual" aria-label="IELTS Pro">
        <div className="student-login-badge">
          IELTS <span>PRO</span>
        </div>
      </section>
    </main>
  );
}
