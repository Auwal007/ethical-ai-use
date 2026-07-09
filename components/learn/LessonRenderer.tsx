"use client";

/**
 * Renders a module's ContentPage[] as paginated markdown lessons, reusing the
 * card-static panel style from the old Module components. Calls onDone when the
 * student advances past the final page.
 */
import { useState } from "react";
import Markdown from "react-markdown";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

import type { ContentPage } from "@/types/api";

export default function LessonRenderer({
  pages,
  onDone,
}: {
  pages: ContentPage[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const ordered = [...pages].sort((a, b) => a.page_order - b.page_order);
  const page = ordered[index];
  const isLast = index === ordered.length - 1;

  if (!page) {
    return (
      <div className="card-static rounded-3xl p-8 text-center">
        <p style={{ color: "var(--text-secondary)" }}>No lesson content available.</p>
        <button onClick={onDone} className="btn-primary mt-4">Continue</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-static rounded-3xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Page {index + 1} of {ordered.length}
          </div>
        </div>
        <h2
          className="text-2xl font-extrabold font-heading mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          {page.title}
        </h2>
        <div
          className="prose-lesson space-y-4 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          <Markdown>{page.body}</Markdown>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="btn-secondary !py-3 flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </button>
        <button
          onClick={() => (isLast ? onDone() : setIndex((i) => i + 1))}
          className="btn-primary !py-3 flex items-center"
        >
          {isLast ? "Continue" : "Next"} <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
