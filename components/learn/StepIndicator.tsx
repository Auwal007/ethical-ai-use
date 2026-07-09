"use client";

/**
 * Generic N-stage step indicator, extending the existing .step-dot / .step-line
 * styling (from globals.css) that the old 3-step modules used. Each step has a
 * label and an icon; the current step is highlighted and past steps show a check.
 */
import { CheckCircle, type LucideIcon } from "lucide-react";

export interface Step {
  key: string;
  label: string;
  icon: LucideIcon;
}

export default function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: Step[];
  currentIndex: number;
}) {
  return (
    <div className="flex items-center justify-center mb-8 flex-wrap gap-y-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const state = i < currentIndex ? "completed" : i === currentIndex ? "active" : "pending";
        return (
          <div key={s.key} className="flex items-center">
            <div className={`step-dot ${state}`}>
              {i < currentIndex ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={`text-xs font-bold ml-2 mr-3 hidden sm:block ${
                i === currentIndex ? "" : "opacity-50"
              }`}
              style={{ color: "var(--text-primary)" }}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className="step-line w-8 mx-1"
                style={{ background: i < currentIndex ? "var(--success)" : "var(--border-color)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
