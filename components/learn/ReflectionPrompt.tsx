"use client";

/**
 * Reflection stage. Serves the module's authored prompt (module.reflection_prompt
 * via the API) and collects a free-text response with a live character count. The
 * 50-character minimum is enforced client-side for UX; the server enforces it too.
 */
import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const MIN_CHARS = 50;

export default function ReflectionPrompt({
  moduleId,
  onDone,
}: {
  moduleId: number;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const [prompt, setPrompt] = useState<string>("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getReflectionPrompt(moduleId)
      .then((info) => {
        if (!active) return;
        setPrompt(info.prompt_text);
        if (info.already_submitted) onDone();
      })
      .catch(() => addToast("Could not load the reflection prompt.", "error"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [moduleId, onDone, addToast]);

  const remaining = Math.max(0, MIN_CHARS - text.trim().length);
  const canSubmit = text.trim().length >= MIN_CHARS && !submitting;

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.postReflection(moduleId, text.trim());
      addToast("Reflection saved.", "success");
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        addToast("You have already reflected on this module.", "warning");
        onDone();
        return;
      }
      addToast(err instanceof ApiError ? err.message : "Could not save your reflection.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card-static rounded-3xl p-8 skeleton h-48" />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-static rounded-3xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}
          >
            <PenLine className="h-3.5 w-3.5" /> Reflection
          </div>
        </div>
        <p
          className="p-5 rounded-2xl leading-relaxed mb-5"
          style={{
            background: "var(--bg-card-hover)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
          }}
        >
          {prompt}
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Write your reflection here…"
          className="input-field !py-3 resize-y"
          style={{ minHeight: "8rem" }}
        />
        <div className="flex items-center justify-between mt-2">
          <span
            className="text-xs font-medium"
            style={{ color: remaining > 0 ? "var(--danger)" : "var(--success-text)" }}
          >
            {remaining > 0
              ? `${remaining} more character${remaining === 1 ? "" : "s"} needed`
              : "Minimum length met"}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {text.trim().length} characters
          </span>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="btn-primary w-full !py-3.5 mt-5"
        >
          {submitting ? "Saving…" : "Submit Reflection"}
        </button>
      </div>
    </div>
  );
}
