"use client";

export default function AdminRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-recovery">
      <section className="admin-recovery-card">
        <p className="eyebrow">Admin recovery</p>
        <h1>Admin panel did not load cleanly.</h1>
        <p className="muted">
          Your browser may be holding an old admin session or an old deployment file. Reload the workspace, or go back to
          the login screen and sign in again.
        </p>
        <div className="admin-recovery-actions">
          <button className="btn btn-primary" onClick={reset}>
            Reload panel
          </button>
          <a className="btn btn-secondary" href="/">
            Back to login
          </a>
        </div>
      </section>
    </main>
  );
}
