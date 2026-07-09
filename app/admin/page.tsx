"use client";

/**
 * Researcher dashboard. Consumes /api/admin/participants/ and /api/admin/stats/,
 * shows aggregate stats + per-dimension pretest-vs-posttest means, a participant
 * table, and a data-export panel with the four anonymised CSV downloads.
 */
import { useEffect, useState } from "react";
import {
  BookOpen,
  Download,
  TrendingUp,
  Users,
} from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { useToast } from "@/components/ui/Toast";
import type { AdminStats, ExportDataset, Participant } from "@/types/api";

const DATASETS: { key: ExportDataset; label: string; desc: string }[] = [
  { key: "scores", label: "Scores", desc: "Pre/post totals + per-dimension" },
  { key: "responses", label: "Responses", desc: "Every item answer + score" },
  { key: "usability", label: "Usability", desc: "Raw + reverse-scored values" },
  { key: "reflections", label: "Reflections", desc: "Free-text by module" },
];

export default function AdminPage() {
  return (
    <RequireAuth requireAdmin>
      <AdminDashboard />
    </RequireAuth>
  );
}

function AdminDashboard() {
  const { addToast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [p, s] = await Promise.all([api.getParticipants(), api.getAdminStats()]);
        if (!active) return;
        setParticipants(p);
        setStats(s);
      } catch (err) {
        addToast(err instanceof ApiError ? err.message : "Could not load admin data.", "error");
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [addToast]);

  const filtered = participants.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  if (!loaded) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-28" />
          ))}
        </div>
        <div className="skeleton rounded-3xl h-96" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Students", value: stats?.total_students ?? 0, icon: Users },
    { label: "Pre-test done", value: stats?.pretest_completed ?? 0, icon: ClipboardIcon },
    { label: "Post-test done", value: stats?.posttest_completed ?? 0, icon: BookOpen },
    { label: "Completion Rate", value: `${stats?.completion_rate ?? 0}%`, icon: TrendingUp },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-heading" style={{ color: "var(--text-primary)" }}>Researcher Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }}>Monitor participant progress and export anonymised data.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <div key={i} className="card-static rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--accent-bg)" }}>
              <s.icon className="h-5 w-5" style={{ color: "var(--accent-text)" }} />
            </div>
            <p className="text-2xl font-black font-heading" style={{ color: "var(--text-primary)" }}>{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Means */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="card-static rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: "var(--text-muted)" }}>Mean pre-test</p>
            <p className="text-2xl font-black font-heading" style={{ color: "var(--text-primary)" }}>{fmt(stats.mean_pretest)}</p>
          </div>
          <div className="card-static rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: "var(--text-muted)" }}>Mean post-test</p>
            <p className="text-2xl font-black font-heading" style={{ color: "var(--text-primary)" }}>{fmt(stats.mean_posttest)}</p>
          </div>
          <div className="card-static rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: "var(--text-muted)" }}>Mean gain</p>
            <p className="text-2xl font-black font-heading" style={{ color: "var(--success)" }}>{fmt(stats.mean_gain)}</p>
          </div>
        </div>
      )}

      {/* Per-dimension means */}
      {stats && (
        <div className="card-static rounded-3xl p-6 mb-8">
          <h2 className="font-bold text-lg font-heading mb-4" style={{ color: "var(--text-primary)" }}>Per-dimension means (pre vs post)</h2>
          <div className="space-y-3">
            {stats.per_dimension.map((d) => (
              <div key={d.dimension} className="flex items-center justify-between text-sm">
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>{d.label}</span>
                <span className="flex items-center gap-3" style={{ color: "var(--text-secondary)" }}>
                  <span>pre {fmt(d.mean_pretest)}</span>
                  <span>→</span>
                  <span style={{ color: "var(--success-text)" }}>post {fmt(d.mean_posttest)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data export */}
      <div className="card-static rounded-3xl p-6 mb-8">
        <h2 className="font-bold text-lg font-heading mb-1" style={{ color: "var(--text-primary)" }}>Data Export (SPSS-ready CSV)</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          All exports are anonymised — pseudonymous participant IDs only, no names or emails.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DATASETS.map((d) => (
            <a
              key={d.key}
              href={api.exportUrl(d.key)}
              className="card rounded-2xl p-4 flex flex-col gap-2 group"
              download
            >
              <Download className="h-5 w-5" style={{ color: "var(--accent)" }} />
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{d.label}</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{d.desc}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div className="card-static rounded-3xl overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <h2 className="font-bold text-lg font-heading" style={{ color: "var(--text-primary)" }}>Participants</h2>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !py-2 !text-sm sm:w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ color: "var(--text-muted)" }} className="text-left text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Participant</th>
                <th className="px-4 py-3 font-semibold">Consent</th>
                <th className="px-4 py-3 font-semibold">Modules</th>
                <th className="px-4 py-3 font-semibold">Pre</th>
                <th className="px-4 py-3 font-semibold">Post</th>
                <th className="px-4 py-3 font-semibold">Gain</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    {search ? "No participants match your search." : "No participants yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td className="px-6 py-3">
                      <p className="font-bold" style={{ color: "var(--text-primary)" }}>{p.full_name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.email}</p>
                    </td>
                    <td className="px-4 py-3">{p.has_consent ? "✓" : "—"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{p.modules_completed}/6</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{p.pretest_total ?? "—"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{p.posttest_total ?? "—"}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: "var(--success-text)" }}>{p.gain ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmt(v: number | null): string {
  return v === null || v === undefined ? "—" : v.toFixed(1);
}

// Small inline icon to avoid an extra import name clash.
function ClipboardIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6a1 1 0 011 1v1h1a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
