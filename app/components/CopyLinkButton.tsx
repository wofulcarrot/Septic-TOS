"use client";

import { useState } from "react";

export function CopyLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/booking/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="px-5 py-2.5 rounded-lg font-medium text-white text-sm whitespace-nowrap transition"
      style={{
        background: copied ? "#86efac20" : "#E07A2F",
        color: copied ? "#86efac" : "white",
        boxShadow: copied ? "none" : "0 6px 24px rgba(224,122,47,0.3)",
        border: copied ? "1px solid #86efac40" : "none",
      }}
    >
      {copied ? "Link copied ✓" : "Copy share link →"}
    </button>
  );
}
