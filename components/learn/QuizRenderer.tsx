"use client";

/**
 * Renders a module quiz (Question[] of MCQs) with radio options styled as in the
 * old Module1. On submit it POSTs to the assessment submit endpoint and shows
 * the per-question feedback (feedback_correct / feedback_incorrect) that the
 * server returns for quizzes.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Assessment, QuizFeedbackItem } from "@/types/api";

export default function QuizRenderer({
  assessment,
  onDone,
}: {
  assessment: Assessment;
  onDone: () => void;
}) {
  const { addToast } = useToast();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<QuizFeedbackItem[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const questions = useMemo(
    () => [...assessment.questions].sort((a, b) => a.question_order - b.question_order),
    [assessment.questions],
  );
  const feedbackById = useMemo(() => {
    const map: Record<number, QuizFeedbackItem> = {};
    (feedback ?? []).forEach((f) => (map[f.question_id] = f));
    return map;
  }, [feedback]);

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const submit = async () => {
    setSubmitting(true);
    try {
      const responses = questions.map((q) => ({ question_id: q.id, answer: answers[q.id] }));
      const result = await api.submitAssessment(assessment.id, responses);
      setFeedback(result.feedback ?? []);
      const correct = (result.feedback ?? []).filter((f) => f.correct).length;
      addToast(`You scored ${correct} of ${questions.length}.`, correct >= questions.length / 2 ? "success" : "warning");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        addToast("You have already completed this quiz.", "warning");
        onDone();
        return;
      }
      addToast(err instanceof ApiError ? err.message : "Could not submit the quiz.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-static rounded-3xl p-8">
        <h2 className="text-2xl font-extrabold font-heading mb-2" style={{ color: "var(--text-primary)" }}>
          {assessment.title}
        </h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Answer every question, then submit to see feedback.
        </p>
      </div>

      <div className="card-static rounded-3xl p-8">
        {questions.map((q, i) => {
          const fb = feedbackById[q.id];
          return (
            <div
              key={q.id}
              className="mb-6 pb-6 last:mb-0 last:pb-0"
              style={{
                borderBottom: i < questions.length - 1 ? "1px solid var(--border-color)" : "none",
              }}
            >
              <p className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                {i + 1}. {q.question_text}
              </p>
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
                        disabled={feedback !== null}
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

              {fb && (
                <div
                  className="mt-3 p-3 rounded-xl flex items-start gap-2"
                  style={{ background: fb.correct ? "var(--success-bg)" : "var(--danger-bg)" }}
                >
                  {fb.correct ? (
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
                  ) : (
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
                  )}
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {fb.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {feedback === null ? (
          <button
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="btn-primary w-full !py-3.5 mt-4"
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        ) : (
          <button onClick={onDone} className="btn-primary w-full !py-3.5 mt-4">
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
