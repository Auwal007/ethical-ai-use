"use client";

/**
 * Pre-test (O1). Gated: a student who has already completed it is sent to the
 * dashboard. Explains that this measures the starting point, gives no feedback
 * by design, and cannot be retaken.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { SkeletonModule } from "@/components/ui/Skeleton";
import AssessmentRenderer from "@/components/learn/AssessmentRenderer";
import type { Assessment } from "@/types/api";

export default function PretestPage() {
  return (
    <RequireAuth allowWithoutPretest>
      <Pretest />
    </RequireAuth>
  );
}

function Pretest() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.pretest_completed) {
      router.replace("/dashboard");
      return;
    }
    let active = true;
    api
      .getPretest()
      .then((a) => active && setAssessment(a))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          router.replace("/dashboard");
        } else {
          addToast(err instanceof ApiError ? err.message : "Could not load the pre-test.", "error");
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, router, addToast]);

  if (loading || !assessment) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <SkeletonModule />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto animate-fade-in-up">
      <div
        className="card-static rounded-3xl p-6 mb-6 flex gap-3"
        style={{ background: "var(--accent-bg)" }}
      >
        <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--accent-text)" }} />
        <div>
          <h1 className="font-bold font-heading text-lg mb-1" style={{ color: "var(--text-primary)" }}>
            Before you begin: the pre-test
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This short assessment measures your current understanding of ethical AI so we can see how
            much you grow. There are <strong>no right-answer results shown</strong> — that is by
            design, so the test stays fair. You can only take it <strong>once</strong>, so answer as
            honestly as you can.
          </p>
        </div>
      </div>

      <AssessmentRenderer
        assessment={assessment}
        continueLabel="Start Learning"
        onComplete={async () => {
          await refreshUser();
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
