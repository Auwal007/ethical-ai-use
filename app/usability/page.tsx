"use client";

/**
 * Usability questionnaire. Gated on the post-test being submitted (API returns
 * 403 otherwise). All Likert items; no feedback. On completion the certificate
 * becomes available.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { useToast } from "@/components/ui/Toast";
import { SkeletonModule } from "@/components/ui/Skeleton";
import AssessmentRenderer from "@/components/learn/AssessmentRenderer";
import type { Assessment } from "@/types/api";

export default function UsabilityPage() {
  return (
    <RequireAuth>
      <Usability />
    </RequireAuth>
  );
}

function Usability() {
  const router = useRouter();
  const { addToast } = useToast();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getUsability()
      .then((a) => active && setAssessment(a))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setBlocked(err.message);
        else addToast(err instanceof ApiError ? err.message : "Could not load the questionnaire.", "error");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [addToast]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <SkeletonModule />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="card-static rounded-3xl p-10 text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-bold font-heading" style={{ color: "var(--text-primary)" }}>
            Questionnaire locked
          </h2>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>{blocked}</p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary mt-6">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto animate-fade-in-up">
      <div className="card-static rounded-3xl p-6 mb-6 flex gap-3" style={{ background: "var(--accent-bg)" }}>
        <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--accent-text)" }} />
        <div>
          <h1 className="font-bold font-heading text-lg mb-1" style={{ color: "var(--text-primary)" }}>
            How was the system?
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Your feedback on the platform helps us evaluate it. There are no right or wrong answers —
            just rate how much you agree with each statement.
          </p>
        </div>
      </div>

      <AssessmentRenderer
        assessment={assessment}
        continueLabel="Get My Certificate"
        onComplete={() => router.push("/certificate")}
      />
    </div>
  );
}
