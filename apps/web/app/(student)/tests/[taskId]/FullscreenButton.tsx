'use client'

import { useEffect, useState } from "react";

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    if (!document.fullscreenElement) {
      const el = document.getElementById("test-content");
      if (el) el.requestFullscreen().catch(() => {});
    }
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      const el = document.getElementById("test-content");
      if (el) el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button className="btn btn-ghost" onClick={toggle} type="button">
      {isFullscreen ? "Exit full screen" : "Full screen"}
    </button>
  );
}
