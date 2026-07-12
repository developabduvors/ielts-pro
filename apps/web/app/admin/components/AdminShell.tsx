import Link from "next/link";
import { AppShell } from "@ielts-pro/ui";
import { adminLogout } from "../actions/auth";
import { AdminNav } from "./AdminNav";
import { AdminPageTitle } from "./AdminPageTitle";

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <AppShell sidebar={<Sidebar email={email} />}>
      <div className="admin-topbar">
        <AdminPageTitle />
        <div className="admin-topbar-actions">
          <Link href="/admin/full-tests/new">New content</Link>
          <Link href="/admin/students">Add student</Link>
        </div>
      </div>
      <div className="admin-content">
        {children}
      </div>
    </AppShell>
  );
}

function Sidebar({ email }: { email: string }) {
  return (
    <>
      <div>
        <div className="sidebar-brand">IELTS <span>Pro</span></div>
        <p className="sidebar-kicker">Teacher command center</p>
      </div>
      <AdminNav />
      <div className="sidebar-user">
        <p>{email}</p>
        <form action={adminLogout}><button className="btn btn-ghost" aria-label="Logout from admin panel">Logout</button></form>
      </div>
    </>
  );
}
