"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const icons: Record<string, ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7" height="7" rx="1.5" {...S} /><rect x="14" y="3" width="7" height="7" rx="1.5" {...S} /><rect x="3" y="14" width="7" height="7" rx="1.5" {...S} /><rect x="14" y="14" width="7" height="7" rx="1.5" {...S} /></>),
  lessons: (<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM19 3v16" {...S} />),
  practice: (<><rect x="4" y="3" width="16" height="18" rx="2" {...S} /><path d="M8 8h8M8 12h8M8 16h5" {...S} /></>),
  mock: (<><path d="M6 3h9l5 5v13H6z" {...S} /><path d="M14 3v6h6" {...S} /><path d="M9 14h6M9 17h4" {...S} /></>),
  speaking: (<><circle cx="9" cy="8" r="3.2" {...S} /><path d="M3.5 20a5.5 5.5 0 0111 0" {...S} /><path d="M17 7a4 4 0 010 8" {...S} /></>),
  vocabulary: (<><path d="M4 7h9M8.5 7v11M6 18h5" {...S} /><path d="M14 18l3-8 3 8M14.8 15.5h4.4" {...S} /></>),
  analytics: (<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...S} /></>)
};

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", aliases: ["/dashboard"] },
  { href: "/lessons", label: "Lessons", icon: "lessons", aliases: ["/lessons", "/lesson"] },
  { href: "/practice", label: "Practice", icon: "practice", aliases: ["/practice", "/tests"] },
  { href: "/mock", label: "Mock", icon: "mock", aliases: ["/mock"] },
  { href: "/speaking", label: "Speaking", icon: "speaking", aliases: ["/speaking"] },
  { href: "https://vocabulary-trainer-smoky.vercel.app/", label: "Vocabulary", icon: "vocabulary", aliases: ["/vocabulary"], external: true },
  { href: "/analytics", label: "Analytics", icon: "analytics", aliases: ["/analytics", "/results", "/progress"] }
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <div className="student-app-nav-list">
      {items.map((item) => {
        const active = item.aliases.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`));
        if (item.external) {
          return (
            <a href={item.href} className={`student-app-nav-link${active ? " is-active" : ""}`} target="_blank" rel="noopener noreferrer" key={item.href}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">{icons[item.icon]}</svg>
              <strong>{item.label}</strong>
            </a>
          );
        }
        return (
          <Link href={item.href} className={`student-app-nav-link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined} key={item.href}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">{icons[item.icon]}</svg>
            <strong>{item.label}</strong>
          </Link>
        );
      })}
    </div>
  );
}
