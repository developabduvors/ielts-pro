"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <main className="admin-recovery">
          <section className="admin-recovery-card">
            <p className="eyebrow">Admin recovery</p>
            <h1>Admin panel could not start.</h1>
            <p className="muted">
              This usually happens after a stale browser cache or an expired admin session. Open the login screen again
              and sign in with the admin account.
            </p>
            <div className="admin-recovery-actions">
              <a className="btn btn-primary" href="/">
                Open admin login
              </a>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
