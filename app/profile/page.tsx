"use client";

/**
 * Ethical Reasoning Profile. Before the post-test: a radar of pretest vs current
 * (learning) scores. After the post-test: pretest vs posttest plus a
 * per-dimension gain table sourced from /api/profile/growth/.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import DimensionRadar, { type RadarDatum } from "@/components/learn/DimensionRadar";
import type { DimensionProfile, GrowthReport } from "@/types/api";

// ATBU palette: green for "after"/current, muted gold for the pretest baseline.
const GREEN = "#1A5C2A";
const GOLD = "#B8960C";

/** Short axis labels so the radar stays legible on a phone. */
function shortLabel(label: string): string {
  return label.replace(" & ", " & ").replace("Privacy & Accountability", "Privacy");
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}

function Profile() {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<DimensionProfile | null>(null);
  const [growth, setGrowth] = useState<GrowthReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await api.getProfile();
        if (!active) return;
        setProfile(p);
        if (p.has_posttest) {
          try {
            const g = await api.getGrowth();
            if (active) setGrowth(g);
          } catch {
            // growth is a bonus; ignore if unavailable
          }
        }
      } catch (err) {
        addToast(err instanceof ApiError ? err.message : "Could not load your profile.", "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [addToast]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!profile) return null;

  const hasPost = profile.has_posttest;

  const radarData: RadarDatum[] = profile.dimensions.map((d) => ({
    dimension: shortLabel(d.label),
    pretest: d.pretest?.percent ?? 0,
    after: hasPost ? d.posttest?.percent ?? 0 : d.current.percent ?? 0,
  }));

  const series = [
    { key: "pretest", label: "Pre-test", color: GOLD },
    { key: "after", label: hasPost ? "Post-test" : "Current", color: GREEN },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto animate-fade-in-up">
      <Link
        href="/dashboard"
        className="text-sm font-medium flex items-center w-fit mb-6 transition hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-extrabold font-heading mb-2" style={{ color: "var(--text-primary)" }}>
        Your Ethical Reasoning Profile
      </h1>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Each spoke is one of the six dimensions of ethical AI reasoning. The further a point sits from
        the centre, the stronger you scored on that dimension (as a percentage).
      </p>

      <div className="card-static rounded-3xl p-6 mb-6">
        <DimensionRadar data={radarData} series={series} />
        {/* Plain-language legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
          <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <span className="w-3 h-3 rounded-sm" style={{ background: GOLD }} /> Pre-test (your starting point)
          </span>
          <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <span className="w-3 h-3 rounded-sm" style={{ background: GREEN }} />
            {hasPost ? "Post-test (after the course)" : "Current (from your learning so far)"}
          </span>
        </div>
      </div>

      {hasPost && growth && (
        <div className="card-static rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" style={{ color: "var(--success)" }} />
            <h2 className="font-bold font-heading text-lg" style={{ color: "var(--text-primary)" }}>
              Growth from pre-test to post-test
            </h2>
          </div>
          <div className="space-y-3">
            {growth.dimensions.map((d) => {
              const gain = Number(d.gain);
              return (
                <div key={d.dimension} className="flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{d.label}</span>
                  <span className="flex items-center gap-3">
                    <span style={{ color: "var(--text-muted)" }}>
                      {d.pretest_score} → {d.posttest_score}
                    </span>
                    <span
                      className="font-bold px-2 py-0.5 rounded-lg"
                      style={{
                        background: gain >= 0 ? "var(--success-bg)" : "var(--danger-bg)",
                        color: gain >= 0 ? "var(--success-text)" : "var(--danger-text)",
                      }}
                    >
                      {gain >= 0 ? "+" : ""}
                      {d.gain}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <div
            className="mt-4 pt-4 flex items-center justify-between font-bold"
            style={{ borderTop: "1px solid var(--border-color)", color: "var(--text-primary)" }}
          >
            <span>Overall</span>
            <span>
              {growth.overall.pretest_total} → {growth.overall.posttest_total}{" "}
              <span style={{ color: "var(--success-text)" }}>
                ({Number(growth.overall.gain) >= 0 ? "+" : ""}
                {growth.overall.gain})
              </span>
            </span>
          </div>
          <Link href="/certificate" className="btn-primary w-full !py-3.5 mt-6 inline-block text-center">
            View Certificate
          </Link>
        </div>
      )}
    </div>
  );
}
