"use client";

import { usePathname } from "next/navigation";

const titles = [
  { href: "/dashboard", label: "Dashboard", note: "Live classroom overview" },
  { href: "/students", label: "Students", note: "Access IDs, sessions, and progress" },
  { href: "/lessons", label: "Content Studio", note: "Lessons, skills, and publishing" },
  { href: "/student-control", label: "Student Control", note: "Activity, progress, and risk tracking" },
  { href: "/full-tests/new", label: "Test Builder", note: "HTML import wizard" },
  { href: "/full-tests", label: "Full Tests", note: "Published and draft exam bundles" },
  { href: "/submissions", label: "Writing Review", note: "Score attempts and feedback" },
  { href: "/analytics", label: "Analytics", note: "Progress and content signals" },
  { href: "/settings", label: "Settings", note: "URLs, defaults, and safe rendering" }
];

export function AdminPageTitle() {
  const pathname = usePathname();
  const current = titles.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) || titles[0];

  return (
    <div className="admin-page-title">
      <span className="admin-status-dot" aria-hidden="true" />
      <div>
        <strong>{current.label}</strong>
        <small>{current.note}</small>
      </div>
    </div>
  );
}
