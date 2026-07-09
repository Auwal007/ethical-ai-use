"use client";

/**
 * Dashboard: the participant's journey home. Replaces the old XP/leaderboard UI
 * with a linear journey strip (Pre-test → M1..M6 → Post-test → Usability →
 * Certificate), the streak pill, a small radar linking to the full profile, and
 * the module list with lock states from is_accessible. Admin sees a portal link.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  CheckCircle,
  ClipboardCheck,
  Flame,
  Lock,
  ChevronRight,
} from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import DimensionRadar, { type RadarDatum } from "@/components/learn/DimensionRadar";
import type { DimensionProfile, ModuleListItem } from "@/types/api";

const GREEN = "#1A5C2A";
const GOLD = "#B8960C";

type JourneyState = "complete" | "current" | "locked";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [modules, setModules] = useState<ModuleListItem[]>([]);
  const [profile, setProfile] = useState<DimensionProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [mods, prof] = await Promise.all([api.getModules(), api.getProfile()]);
        if (!active) return;
        setModules(mods);
        setProfile(prof);
      } catch (err) {
        addToast(err instanceof ApiError ? err.message : "Could not load your dashboard.", "error");
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [addToast]);

  const completedCount = useMemo(
    () => modules.filter((m) => m.status === "completed").length,
    [modules],
  );
  const allModulesDone = modules.length > 0 && completedCount === modules.length;

  const radarData: RadarDatum[] = useMemo(
    () =>
      (profile?.dimensions ?? []).map((d) => ({
        dimension: d.label.split(" ")[0],
        current: d.current.percent ?? 0,
      })),
    [profile],
  );

  if (!user || !loaded) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in-up">
      {/* Header row: greeting + streak */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Welcome back
          </p>
          <h1 className="text-3xl font-extrabold font-heading" style={{ color: "var(--text-primary)" }}>
            {user.full_name.split(" ")[0]}
          </h1>
        </div>
        {user.streak > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border w-fit"
            style={{
              background: "var(--warning-bg)",
              color: "var(--warning-text)",
              borderColor: "rgba(184,150,12,0.3)",
            }}
          >
            <Flame className="h-4 w-4" />
            {user.streak} day streak
          </div>
        )}
      </div>

      {/* Journey strip */}
      <JourneyStrip
        pretestDone={user.pretest_completed}
        modules={modules}
        allModulesDone={allModulesDone}
        posttestAvailable={user.posttest_available}
        profile={profile}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Module list */}
        <div className="lg:col-span-8">
          <div className="card-static rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg font-heading" style={{ color: "var(--text-primary)" }}>
                Learning Modules
              </h2>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}
              >
                {completedCount} of {modules.length}
              </span>
            </div>
            <div className="space-y-3">
              {modules.map((m) => (
                <ModuleRow key={m.id} module={m} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Radar snapshot */}
          {profile && (profile.has_pretest || completedCount > 0) && (
            <Link href="/profile" className="card rounded-3xl p-5 block group">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold font-heading" style={{ color: "var(--text-primary)" }}>
                  Reasoning Profile
                </h2>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" style={{ color: "var(--text-muted)" }} />
              </div>
              <DimensionRadar
                data={radarData}
                series={[{ key: "current", label: "Current", color: GREEN }]}
                height={220}
              />
            </Link>
          )}

          {/* Admin portal */}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="card rounded-3xl p-5 flex items-center justify-between group text-white"
              style={{ background: "linear-gradient(135deg, #1f2937, #0f172a)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: GREEN }}>
                  🛠️
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Admin Portal</p>
                  <p className="text-sm font-medium">Monitor & Export</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function JourneyStrip({
  pretestDone,
  modules,
  allModulesDone,
  posttestAvailable,
  profile,
}: {
  pretestDone: boolean;
  modules: ModuleListItem[];
  allModulesDone: boolean;
  posttestAvailable: boolean;
  profile: DimensionProfile | null;
}) {
  const posttestDone = profile?.has_posttest ?? false;
  // usability/certificate completion isn't directly on /me; infer from posttest+.
  const steps: { label: string; href: string; state: JourneyState }[] = [];

  steps.push({
    label: "Pre-test",
    href: "/pretest",
    state: pretestDone ? "complete" : "current",
  });

  modules.forEach((m) => {
    const state: JourneyState =
      m.status === "completed" ? "complete" : m.is_accessible ? "current" : "locked";
    steps.push({ label: `M${m.sequence_no}`, href: `/modules/${m.id}`, state });
  });

  steps.push({
    label: "Post-test",
    href: "/posttest",
    state: posttestDone ? "complete" : allModulesDone && posttestAvailable ? "current" : "locked",
  });
  steps.push({
    label: "Usability",
    href: "/usability",
    state: posttestDone ? "current" : "locked",
  });
  steps.push({
    label: "Certificate",
    href: "/certificate",
    state: posttestDone ? "current" : "locked",
  });

  return (
    <div className="card-static rounded-3xl p-5 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <JourneyNode {...s} />
            {i < steps.length - 1 && (
              <div
                className="w-6 h-0.5 mx-1"
                style={{ background: s.state === "complete" ? "var(--success)" : "var(--border-color)" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneyNode({
  label,
  href,
  state,
}: {
  label: string;
  href: string;
  state: JourneyState;
}) {
  const content = (
    <div className="flex flex-col items-center gap-1 min-w-[52px]">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background:
            state === "complete" ? "var(--success)" : state === "current" ? "var(--accent)" : "var(--border-color)",
          color: state === "locked" ? "var(--text-muted)" : "white",
        }}
      >
        {state === "complete" ? (
          <CheckCircle className="h-5 w-5" />
        ) : state === "locked" ? (
          <Lock className="h-4 w-4" />
        ) : (
          label.startsWith("M") ? label.slice(1) : <ArrowRight className="h-4 w-4" />
        )}
      </div>
      <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );

  if (state === "locked") return content;
  return (
    <Link href={href} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
}

function ModuleRow({ module }: { module: ModuleListItem }) {
  const isCompleted = module.status === "completed";
  const isAccessible = module.is_accessible;

  const inner = (
    <div
      className={`group p-4 rounded-2xl flex items-center justify-between transition-all ${
        isAccessible || isCompleted ? "cursor-pointer" : "opacity-50"
      }`}
      style={{
        background: isCompleted
          ? "var(--success-bg)"
          : isAccessible
          ? "var(--accent-bg)"
          : "var(--bg-card-hover)",
        border: isCompleted
          ? "2px solid var(--success)"
          : isAccessible
          ? "2px solid var(--accent)"
          : "1px solid var(--border-color)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
          style={{
            background: isCompleted ? "var(--success)" : isAccessible ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {isCompleted ? <CheckCircle className="h-5 w-5" /> : `0${module.sequence_no}`}
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{module.title}</p>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{
              color: isCompleted ? "var(--success-text)" : isAccessible ? "var(--accent-text)" : "var(--text-muted)",
            }}
          >
            {isCompleted ? "Completed" : isAccessible ? "Available now" : "Locked"}
          </p>
        </div>
      </div>
      <div className="shrink-0 ml-2">
        {isCompleted ? (
          <CheckCircle className="h-5 w-5" style={{ color: "var(--success)" }} />
        ) : isAccessible ? (
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" style={{ color: "var(--accent)" }} />
        ) : (
          <Lock className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        )}
      </div>
    </div>
  );

  if (isCompleted || isAccessible) {
    return <Link href={`/modules/${module.id}`}>{inner}</Link>;
  }
  return inner;
}
