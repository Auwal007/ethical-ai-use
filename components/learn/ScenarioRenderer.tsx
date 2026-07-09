"use client";

/**
 * Renders one Scenario: situation text + option cards (styling reused from the
 * old Module3). On selection it POSTs the choice, then reveals the option's
 * consequence and ethical principle inline. If the choice unlocks new scenarios,
 * it surfaces a clear cue and reports the unlocked ids to the parent so the
 * stage machine can refetch and show them.
 */
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle, ShieldAlert, Sparkles } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Scenario, ScenarioChoiceResult } from "@/types/api";

export default function ScenarioRenderer({
  scenario,
  index,
  total,
  onResolved,
}: {
  scenario: Scenario;
  index: number;
  total: number;
  /** Called after a successful choice, with any newly unlocked scenario ids. */
  onResolved: (unlockedIds: number[]) => void;
}) {
  const { addToast } = useToast();
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<ScenarioChoiceResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (selected === null) return;
    setSubmitting(true);
    try {
      const res = await api.chooseScenarioOption(scenario.id, selected);
      setResult(res);
      if (res.newly_unlocked_scenario_ids.length > 0) {
        addToast("This choice has opened a new scenario.", "info");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not record your choice.";
      // 409 = already answered: treat as resolved so the flow can continue.
      if (err instanceof ApiError && err.status === 409) {
        addToast("You have already answered this scenario.", "warning");
        onResolved([]);
        return;
      }
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Scenario {index + 1} of {total}
        </span>
      </div>

      <div className="card-static rounded-3xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}
          >
            <ShieldAlert className="h-3.5 w-3.5 inline mr-1" />
            Interactive Scenario
          </div>
        </div>

        <p
          className="p-5 rounded-2xl leading-relaxed mb-6 whitespace-pre-line"
          style={{
            background: "var(--bg-card-hover)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
          }}
        >
          {scenario.situation_text}
        </p>

        <h3 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-primary)" }}>
          What is the most ethical approach?
        </h3>

        <div className="space-y-3">
          {scenario.options.map((opt) => {
            const isSelected = selected === opt.id;
            const locked = result !== null;
            return (
              <div
                key={opt.id}
                onClick={() => !locked && setSelected(opt.id)}
                className={`p-4 rounded-2xl transition-all ${
                  locked ? "opacity-70" : "cursor-pointer"
                }`}
                style={{
                  border: isSelected ? "2px solid var(--accent)" : "2px solid var(--border-color)",
                  background: isSelected ? "var(--accent-bg)" : "transparent",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ borderColor: isSelected ? "var(--accent)" : "var(--text-muted)" }}
                  >
                    {isSelected && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {opt.option_text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {result && (
          <div
            className="mt-6 p-5 rounded-2xl animate-fade-in-up"
            style={{ background: "var(--accent-bg)", border: "1px solid var(--border-color)" }}
          >
            <h4
              className="font-bold flex items-center gap-2 mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              <CheckCircle className="h-5 w-5" style={{ color: "var(--success)" }} />
              Outcome
            </h4>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              {result.consequence_text}
            </p>
            <p className="text-xs font-semibold" style={{ color: "var(--accent-text)" }}>
              Ethical principle: {result.ethical_principle}
            </p>
            {result.newly_unlocked_scenario_ids.length > 0 && (
              <div
                className="mt-4 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold"
                style={{ background: "var(--warning-bg)", color: "var(--warning-text)" }}
              >
                <Sparkles className="h-4 w-4" />
                This choice has opened a new scenario.
              </div>
            )}
          </div>
        )}

        {!result ? (
          <button
            onClick={submit}
            disabled={selected === null || submitting}
            className="btn-primary w-full !py-3.5 mt-6"
          >
            {submitting ? "Saving…" : "Submit Decision"}
          </button>
        ) : (
          <button
            onClick={() => onResolved(result.newly_unlocked_scenario_ids)}
            className="btn-primary w-full !py-3.5 mt-6 flex items-center justify-center"
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        )}
      </div>

      {submitting && (
        <p className="sr-only" role="status">
          <AlertTriangle className="hidden" /> Saving your decision
        </p>
      )}
    </div>
  );
}
