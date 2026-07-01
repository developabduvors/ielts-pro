import Link from "next/link";
import { studentLogout } from "../actions/auth";

export function StudentShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <>
      <header className="student-topbar">
        <div className="student-topbar-inner">
          <Link className="brand" href="/dashboard">
            IELTS <span>Pro</span>
          </Link>
          <nav className="student-nav" aria-label="Student navigation">
            <Link href="/dashboard">Practice</Link>
            <Link href="/progress">Results</Link>
            <form action={studentLogout}>
              <button className="btn btn-ghost" aria-label="Logout from student portal">Logout</button>
            </form>
          </nav>
          <div className="student-chip">{name}</div>
        </div>
      </header>
      {children}
    </>
  );
}
