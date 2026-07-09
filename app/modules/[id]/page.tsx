"use client";

/**
 * Module stage machine: lesson → scenario(s) → quiz → reflection → complete.
 *
 * All content is data-driven from the API. Scenarios are re-fetched after each
 * choice so branch-unlocked scenarios appear in sequence. Completion is only
 * attempted once the earlier stages are done; a 403 from the API (preconditions
 * unmet) surfaces its reason instead of failing silently.
 */
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle, HelpCircle, PenLine, ShieldAlert } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { SkeletonModule } from "@/components/ui/Skeleton";
import LessonRenderer from "@/components/learn/LessonRenderer";
import ScenarioRenderer from "@/components/learn/ScenarioRenderer";
import QuizRenderer from "@/components/learn/QuizRenderer";
import ReflectionPrompt from "@/components/learn/ReflectionPrompt";
import StepIndicator, { type Step } from "@/components/learn/StepIndicator";
import type { Assessment, ModuleDetail } from "@/types/api";

type Stage = "lesson" | "scenarios" | "quiz" | "reflection" | "complete";

const STEPS: Step[] = [
  { key: "lesson", label: "Learn", icon: BookOpen },
  { key: "scenarios", label: "Scenarios", icon: ShieldAlert },
  { key: "quiz", label: "Quiz", icon: HelpCircle },
  { key: "reflection", label: "Reflect", icon: PenLine },
  { key: "complete", label: "Done", icon: CheckCircle },
];

export default function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <ModuleStageMachine moduleId={Number(id)} />
    </RequireAuth>
  );
}

function ModuleStageMachine({ moduleId }: { moduleId: number }) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { addToast } = useToast();

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [quiz, setQuiz] = useState<Assessment | null>(null);
  const [stage, setStage] = useState<Stage>("lesson");
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const loadModule = useCallback(async () => {
    try {
      const data = await api.getModule(moduleId);
      setModule(data);
      return data;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not load this module.";
      setLoadError(msg);
      return null;
    }
  }, [moduleId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const mod = await loadModule();
      if (!active || !mod) return;
      try {
        const q = await api.getQuiz(moduleId);
        if (active) setQuiz(q);
      } catch {
        // A module may legitimately lack a quiz; the stage will be skipped.
        if (active) setQuiz(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [moduleId, loadModule]);

  const scenarios = useMemo(
    () => (module ? [...module.scenarios].sort((a, b) => a.scenario_order - b.scenario_order) : []),
    [module],
  );

  const complete = useCallback(async () => {
    setCompleting(true);
    try {
      await api.completeModule(moduleId);
      await refreshUser();
      addToast("Module completed!", "success");
      router.push("/dashboard");
    } catch (err) {
      // 403 = preconditions unmet: show the reason from the API.
      addToast(err instanceof ApiError ? err.message : "Could not complete the module.", "error");
      setStage("lesson");
    } finally {
      setCompleting(false);
    }
  }, [moduleId, refreshUser, addToast, router]);

  const currentStepIndex = STEPS.findIndex((s) => s.key === stage);

  if (loadError) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="card-static rounded-3xl p-10 text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-bold font-heading" style={{ color: "var(--text-primary)" }}>
            Not available yet
          </h2>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>{loadError}</p>
          <Link href="/dashboard" className="btn-primary mt-6 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <SkeletonModule />
      </div>
    );
  }

  const advanceFromScenarios = () => {
    if (scenarioIndex < scenarios.length - 1) {
      setScenarioIndex((i) => i + 1);
    } else {
      setStage(quiz ? "quiz" : "reflection");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm font-medium flex items-center transition hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
        </Link>
        <span
          className="text-xs font-bold px-3 py-1 rounded-lg"
          style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}
        >
          Module {module.sequence_no}
        </span>
      </div>

      <h1 className="text-3xl font-extrabold font-heading mb-6 text-center" style={{ color: "var(--text-primary)" }}>
        {module.title}
      </h1>

      <StepIndicator steps={STEPS} currentIndex={currentStepIndex} />

      {stage === "lesson" && (
        <LessonRenderer
          pages={module.pages}
          onDone={() => setStage(scenarios.length > 0 ? "scenarios" : quiz ? "quiz" : "reflection")}
        />
      )}

      {stage === "scenarios" && scenarios[scenarioIndex] && (
        <ScenarioRenderer
          key={scenarios[scenarioIndex].id}
          scenario={scenarios[scenarioIndex]}
          index={scenarioIndex}
          total={scenarios.length}
          onResolved={async (unlockedIds) => {
            // If a choice unlocked new scenarios, refetch so they appear in order.
            if (unlockedIds.length > 0) {
              await loadModule();
            }
            advanceFromScenarios();
          }}
        />
      )}

      {stage === "quiz" && quiz && (
        <QuizRenderer assessment={quiz} onDone={() => setStage("reflection")} />
      )}

      {stage === "reflection" && (
        <ReflectionPrompt moduleId={moduleId} onDone={() => setStage("complete")} />
      )}

      {stage === "complete" && (
        <div className="card-static rounded-3xl p-10 text-center animate-fade-in-up">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold font-heading" style={{ color: "var(--text-primary)" }}>
            You&apos;ve finished the learning for this module
          </h2>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
            Mark it complete to unlock the next step of your journey.
          </p>
          <button onClick={complete} disabled={completing} className="btn-primary mt-6 !py-3.5 !px-8">
            {completing ? "Completing…" : "Complete Module"}
          </button>
        </div>
      )}
    </div>
  );
}
