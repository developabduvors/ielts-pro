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
      <div>
        <div className="sidebar-brand">IELTS <span>Pro</span></div>
        <p className="sidebar-kicker">Teacher operations</p>
      </div>
      <nav aria-label="Admin navigation">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/students">Students</Link>
        <Link href="/lessons">Lessons & Tests</Link>
        <Link href="/submissions">Writing Review</Link>
      </nav>
      <div className="sidebar-user">
        <p>{email}</p>
        <form action={adminLogout}><button className="btn btn-ghost" aria-label="Logout from admin panel">Logout</button></form>
      </div>
    </>
  );
}
