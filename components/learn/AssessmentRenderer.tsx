"use client";

/**
 * Renders the pre-test, post-test, and usability instruments. Handles both MCQ
 * and Likert items. By research design it shows NO feedback and NO score on
 * submission — only a confirmation and a continue action — so the instrument is
 * not contaminated. Likert items render as a labelled 5-point scale.
 */
import { useMemo, useState } from "react";
import { CheckCircle } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Assessment } from "@/types/api";

export default function AssessmentRenderer({
  assessment,
  onComplete,
  continueLabel = "Continue",
}: {
  assessment: Assessment;
  onComplete: () => void;
  continueLabel?: string;
}) {
  const { addToast } = useToast();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const questions = useMemo(
    () => [...assessment.questions].sort((a, b) => a.question_order - b.question_order),
    [assessment.questions],
  );
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const submit = async () => {
    setSubmitting(true);
    try {
      const responses = questions.map((q) => ({ question_id: q.id, answer: answers[q.id] }));
      await api.submitAssessment(assessment.id, responses);
      setDone(true);
      addToast("Your responses have been recorded.", "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        addToast("You have already completed this.", "warning");
        setDone(true);
        return;
      }
      addToast(err instanceof ApiError ? err.message : "Could not submit your responses.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="card-static rounded-3xl p-10 text-center animate-fade-in-up">
        <CheckCircle className="h-14 w-14 mx-auto mb-4" style={{ color: "var(--success)" }} />
        <h2 className="text-2xl font-extrabold font-heading" style={{ color: "var(--text-primary)" }}>
          Responses recorded
        </h2>
        <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
          Thank you. Your answers have been saved securely.
        </p>
        <button onClick={onComplete} className="btn-primary mt-6 !py-3.5 !px-8">
          {continueLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-static rounded-3xl p-8 space-y-6">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="pb-6 last:pb-0"
            style={{
              borderBottom: i < questions.length - 1 ? "1px solid var(--border-color)" : "none",
            }}
          >
            <p className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {i + 1}. {q.question_text}
            </p>

            {q.question_type === "likert" ? (
              <LikertScale
                options={q.options ?? []}
                value={answers[q.id]}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              />
            ) : (
              <div className="space-y-2">
                {(q.options ?? []).map((opt) => {
                  const isChosen = answers[q.id] === opt;
                  return (
                    <label
                      key={opt}
                      className="flex items-center p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: isChosen ? "var(--accent-bg)" : "transparent",
                        border: isChosen
                          ? "1.5px solid var(--accent)"
                          : "1.5px solid var(--border-color)",
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="mr-3 accent-indigo-600"
                        checked={isChosen}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      />
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={!allAnswered || submitting}
        className="btn-primary w-full !py-4 text-lg"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </div>
  );
}

/** Labelled 5-point Likert scale. Stores the 1-based value as a string. */
function LikertScale({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map((label, idx) => {
        const val = String(idx + 1);
        const isChosen = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all text-center"
            style={{
              background: isChosen ? "var(--accent-bg)" : "var(--bg-card-hover)",
              border: isChosen ? "2px solid var(--accent)" : "1px solid var(--border-color)",
            }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: isChosen ? "var(--accent)" : "transparent",
                color: isChosen ? "white" : "var(--text-muted)",
                border: isChosen ? "none" : "1px solid var(--border-color)",
              }}
            >
              {val}
            </span>
            <span
              className="text-[10px] leading-tight font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
