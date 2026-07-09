"use client";

/**
 * Printable certificate. Composed entirely from existing endpoints:
 *   - name from /api/auth/me/
 *   - six-dimension profile from /api/profile/ (or growth if available)
 *   - a deterministic display-only verification code derived client-side.
 * Available once the usability questionnaire is submitted. Uses @media print
 * styles so a clean sheet prints without the app chrome.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Printer } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { DimensionProfile, Me } from "@/types/api";

/** Simple deterministic code from stable inputs (display-only, not server-verified). */
function verificationCode(userId: number, email: string): string {
  let hash = 0;
  const seed = `${userId}:${email}:eailt`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `ATBU-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export default function CertificatePage() {
  return (
    <RequireAuth>
      <Certificate />
    </RequireAuth>
  );
}

function Certificate() {
  const router = useRouter();
  const { addToast } = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<DimensionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [meData, profileData] = await Promise.all([api.me(), api.getProfile()]);
        if (!active) return;
        setMe(meData);
        setProfile(profileData);
      } catch (err) {
        addToast(err instanceof ApiError ? err.message : "Could not load your certificate.", "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [addToast]);

  const code = useMemo(
    () => (me ? verificationCode(me.id, me.email) : ""),
    [me],
  );

  const issued = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <SkeletonCard />
      </div>
    );
  }

  if (!me || !profile) return null;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {/* Controls — hidden when printing */}
      <div className="flex items-center justify-between mb-6 no-print">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to Dashboard
        </button>
        <button onClick={() => window.print()} className="btn-primary !py-2.5 flex items-center">
          <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </button>
      </div>

      {/* Certificate sheet */}
      <div
        className="certificate-sheet rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
        style={{ background: "var(--bg-card)", border: "2px solid var(--gold)" }}
      >
        <Award
          className="absolute -right-16 -bottom-16 opacity-[0.05] pointer-events-none"
          style={{ width: 320, height: 320, color: "var(--green)" }}
        />

        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "var(--gold)" }}>
          Abubakar Tafawa Balewa University
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading mb-6" style={{ color: "var(--green)" }}>
          Certificate of Completion
        </h1>
        <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
          This certifies that
        </p>
        <p className="text-3xl font-bold font-heading mb-4" style={{ color: "var(--text-primary)" }}>
          {me.full_name}
        </p>
        <p className="text-sm max-w-md mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
          has completed the <strong>Ethical AI Literacy</strong> programme, demonstrating competence
          across the six dimensions of responsible AI reasoning.
        </p>

        {/* Six-dimension profile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
          {profile.dimensions.map((d) => {
            const pct = (d.posttest ?? d.current)?.percent ?? 0;
            return (
              <div
                key={d.dimension}
                className="p-3 rounded-xl"
                style={{ background: "var(--accent-bg)" }}
              >
                <div className="text-lg font-black font-heading" style={{ color: "var(--green)" }}>
                  {pct}%
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-sm" style={{ borderTop: "1px solid var(--border-color)" }}>
          <div className="text-left">
            <p className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--text-muted)" }}>Issued</p>
            <p style={{ color: "var(--text-primary)" }}>{issued}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--text-muted)" }}>Verification code</p>
            <p className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>{code}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
