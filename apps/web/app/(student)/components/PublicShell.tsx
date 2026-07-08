"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { PublicSiteSettings } from "@ielts-pro/shared";

const menuItems = [
  { href: "/", label: "What's new", tag: "" },
  { href: "/mock-exam", label: "Mock exam", tag: "New" },
  { href: "/practice-tests", label: "Practice tests", tag: "Popular" },
  { href: "/writing-practice", label: "Writing practice", tag: "New" },
  { href: "/article-lessons", label: "Article lessons", tag: "" },
  { href: "/free-course", label: "Free listening course", tag: "" },
  { href: "/student-results", label: "Student results", tag: "" },
  { href: "/about", label: "About", tag: "" },
  { href: "/contact", label: "Contact", tag: "" }
];

export function PublicShell({ children, settings }: { children: ReactNode; settings?: PublicSiteSettings }) {
  const [open, setOpen] = useState(false);
  const [liveSettings, setLiveSettings] = useState<PublicSiteSettings | undefined>(settings);
  const activeSettings = liveSettings || settings;
  const brandName = activeSettings?.brand_name || "IELTS Pro";
  const teacherName = activeSettings?.teacher_name || "Miravzal";
  const logoText = activeSettings?.logo_text || "IP";
  const menu = menuItems.filter((item) => activeSettings?.free_course_enabled === false ? item.href !== "/free-course" : true);

  useEffect(() => {
    let active = true;
    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PublicSiteSettings | null) => {
        if (active && data) setLiveSettings(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="public-shell">
      <header className="public-topbar">
        <div className="public-topbar-side">
          <button className="public-menu-button" type="button" onClick={() => setOpen(true)} aria-expanded={open}>
            <span className="menu-lines" aria-hidden="true"><i /><i /><i /></span>
            Menu
          </button>
          <Link className="public-home-icon" href="/" aria-label="Home">Home</Link>
        </div>
        <Link className="public-brand" href="/">
          <span className="public-logo-mark">{logoText}</span>
          <span>{brandName}</span>
          <small>{teacherName}</small>
        </Link>
        <div className="public-topbar-side public-topbar-right">
          <Link className="public-signin" href="/login">Student login</Link>
          <Link className="public-cta" href="/practice-tests">Start</Link>
        </div>
      </header>

      {open ? (
        <div className="public-drawer-layer" role="dialog" aria-modal="true" aria-label="Student navigation">
          <button className="public-drawer-backdrop" type="button" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="public-drawer">
            <div className="public-drawer-head">
              <div>
                <strong>Menu</strong>
                <p>Explore IELTS practice</p>
              </div>
              <button className="public-close" type="button" onClick={() => setOpen(false)} aria-label="Close menu">Close</button>
            </div>
            <nav className="public-drawer-nav">
              {menu.map((item, index) => (
                <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
                  <span>{item.label}</span>
                  {item.tag ? <small>{item.tag}</small> : null}
                  <i aria-hidden="true">{index + 1}</i>
                </Link>
              ))}
            </nav>
            <Link className="drawer-action" href="/login" onClick={() => setOpen(false)}>Enter student portal</Link>
          </aside>
        </div>
      ) : null}

      {children}

      <footer className="public-footer">
        <div>
          <Link className="public-brand public-brand-footer" href="/">
            <span className="public-logo-mark">{logoText}</span>
            <span>{brandName}</span>
          </Link>
          <p>Teacher-led IELTS practice, lessons, and student progress with {teacherName}.</p>
        </div>
        <nav>
          <strong>Practice</strong>
          <Link href="/practice-tests">Practice tests</Link>
          <Link href="/writing-practice">Writing practice</Link>
          <Link href="/article-lessons">Article lessons</Link>
          <Link href="/free-course">Listening course</Link>
        </nav>
        <nav>
          <strong>Information</strong>
          <Link href="/student-results">Student results</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <nav>
          <strong>Portal</strong>
          <Link href="/login">Student login</Link>
          <Link href="/mock-exam">Mock exam</Link>
        </nav>
      </footer>
    </div>
  );
}
