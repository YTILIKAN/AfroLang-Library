"use client";

import { useState } from "react";

interface CopyCodeProps {
  code: string;
  language?: string;
}

export function CopyCode({ code, language = "bash" }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="overflow-hidden rounded-sm border border-ink-black/15 bg-ink-black text-cream-paper shadow-[var(--shadow-subtle)]">
      <div className="flex items-center justify-between border-b border-cream-paper/15 px-4 py-2">
        <span className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-cream-paper/60">{language}</span>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-cream-paper/70 transition hover:text-cream-paper"
        >
          {copied ? "Copie" : "Copier"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono-ui text-xs leading-relaxed text-cream-paper/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}