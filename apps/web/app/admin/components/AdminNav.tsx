"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "D" },
  { href: "/admin/students", label: "Students", icon: "S" },
  { href: "/admin/student-control", label: "Student Control", icon: "P" },
  { href: "/admin/lessons", label: "Content Studio", icon: "C" },
  { href: "/admin/full-tests/new", label: "Test Builder", icon: "B" },
  { href: "/admin/html-tests/new", label: "HTML Tests", icon: "H" },
  { href: "/admin/submissions", label: "Writing Review", icon: "W" },
  { href: "/admin/analytics", label: "Analytics", icon: "A" },
  { href: "/admin/settings", label: "Settings", icon: "T" }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined} key={item.href}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
