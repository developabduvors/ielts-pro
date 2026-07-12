"use client";

import { useEffect, useRef } from "react";

export function HtmlTestContent({ html, taskId }: { html: string; taskId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = html;

    const key = `__ielts_inj_${taskId}`;
    if ((window as any)[key]) return;
    (window as any)[key] = true;

    containerRef.current.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      const src = (oldScript.textContent || "").replace(/\b(const|let)\b/g, "var");
      newScript.textContent = src;
      oldScript.replaceWith(newScript);
    });
  }, [html, taskId]);

  return <div ref={containerRef} className="html-test-content" />;
}
