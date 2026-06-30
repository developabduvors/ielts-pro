import Link from "next/link";
import { AppShell } from "@ielts-pro/ui";
import { adminLogout } from "../actions/auth";

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <AppShell sidebar={<Sidebar email={email} />}>
      {children}
    </AppShell>
  );
}

function Sidebar({ email }: { email: string }) {
  return (
    <>
      <div className="sidebar-brand">IELTS <span>Pro</span></div>
      <nav aria-label="Admin navigation">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/students">Students</Link>
        <Link href="/lessons">Lessons & Tests</Link>
        <Link href="/submissions">Writing Review</Link>
      </nav>
      <div style={{ marginTop: "auto" }}>
        <p style={{ color: "rgba(255,255,255,.52)", fontSize: 13 }}>{email}</p>
        <form action={adminLogout}><button className="btn btn-ghost">Logout</button></form>
      </div>
    </>
  );
}
