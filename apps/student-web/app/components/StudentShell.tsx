import Link from "next/link";
import type { ReactNode } from "react";
import { studentLogout } from "../actions/auth";
import { StudentNav } from "./StudentNav";

type StudentShellProps = {
  name: string;
  groupName?: string | null;
  sectionLabel?: string;
  sectionDescription?: string;
  variant?: "app" | "exam";
  children: ReactNode;
};

export function StudentShell({ name, groupName, sectionLabel = "Student workspace", sectionDescription = "Practice, results, and teacher feedback", variant = "app", children }: StudentShellProps) {
  if (variant === "exam") {
    return (
      <div className="student-exam-shell">
        <header className="student-exam-topbar">
          <Link className="student-app-brand" href="/dashboard">
            IELTS <span>Pro</span>
          </Link>
          <div className="student-exam-meta">
            <span>{name}</span>
            <form action={studentLogout}>
              <button className="student-outline-button" aria-label="Logout from student portal">Logout</button>
            </form>
          </div>
        </header>
        {children}
      </div>
    );
  }

  const initials = name.split(" ").map((part) => part.slice(0, 1)).join("").slice(0, 2).toUpperCase() || "S";

  return (
    <div className="student-app-shell">
      <aside className="student-app-sidebar">
        <Link className="student-app-brand" href="/dashboard">
          Ielts <span>Pro</span>
        </Link>
        <nav aria-label="Student navigation">
          <StudentNav />
        </nav>
        <div className="student-sidebar-footer">
          <span>{groupName || "Group pending"}</span>
          <form action={studentLogout}>
            <button aria-label="Logout from student portal">Logout</button>
          </form>
        </div>
      </aside>

      <div className="student-app-main">
        <header className="student-page-topbar">
          <div className="student-topbar-search" aria-label="Search">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input placeholder="Search" aria-label="Search" />
          </div>

          <div className="student-topbar-actions">
            <button className="student-topbar-icon" type="button" aria-label="Settings">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button className="student-topbar-icon" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.7 21a2 2 0 01-3.4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <Link className="student-topbar-user" href="/profile">
              <div className="student-topbar-user-text">
                <strong>{name}</strong>
                <span>{groupName || "Group pending"}</span>
              </div>
              <span className="student-topbar-avatar" aria-hidden="true">{initials}</span>
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
