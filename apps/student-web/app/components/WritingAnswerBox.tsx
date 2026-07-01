"use client";

import { useMemo, useState } from "react";

export function WritingAnswerBox({
  name,
  label,
  placeholder,
  minWords,
  required = false
}: {
  name: string;
  label: string;
  placeholder: string;
  minWords?: number;
  required?: boolean;
}) {
  const [value, setValue] = useState("");
  const wordCount = useMemo(() => value.trim().split(/\s+/).filter(Boolean).length, [value]);
  const target = minWords && minWords > 0 ? minWords : null;
  const progress = target ? Math.min(100, Math.round((wordCount / target) * 100)) : 0;

  return (
    <label className="writing-box">
      <span>{label}</span>
      <textarea
        className="field textarea"
        name={name}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <span className="writing-meter" aria-live="polite">
        <span>{wordCount} words</span>
        {target ? <span>{Math.max(target - wordCount, 0)} to target</span> : <span>Teacher reviewed</span>}
      </span>
      {target ? (
        <span className="writing-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
      ) : null}
    </label>
  );
}
