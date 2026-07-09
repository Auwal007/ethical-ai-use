"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import type { PriorAIExposure } from "@/types/api";

const CONSENT_VERSION = "1.0";

const EXPOSURE_OPTIONS: { value: Exclude<PriorAIExposure, "">; label: string }[] = [
  { value: "none", label: "None — I have not used AI tools" },
  { value: "basic", label: "Basic — I have tried them a few times" },
  { value: "regular", label: "Regular — I use them often" },
  { value: "advanced", label: "Advanced — I use them daily / build with them" },
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [faculty, setFaculty] = useState("");
  const [level, setLevel] = useState("");
  const [exposure, setExposure] = useState<PriorAIExposure>("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const router = useRouter();
  const { refreshUser } = useAuth();
  const { addToast } = useToast();

  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"][strength];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!consent) {
      setError("You must agree to the consent form to participate.");
      return;
    }
    setLoading(true);
    try {
      await api.register({
        full_name: fullName,
        email,
        password,
        faculty,
        level_of_study: level,
        prior_ai_exposure: exposure,
        consent_agreed: consent,
        consent_version: CONSENT_VERSION,
      });
      await refreshUser();
      addToast("Account created — let's begin with the pre-test.", "success");
      router.push("/pretest");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="card-static rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg" style={{ background: "var(--green)" }}>
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading" style={{ color: "var(--text-primary)" }}>Join the study</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Create your account to begin the Ethical AI Literacy programme
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "var(--danger-bg)", color: "var(--danger-text)" }}>
                {error}
              </div>
            )}

            <Field label="Full Name" icon={User}>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field !pl-11" required placeholder="Muhammad Adam" />
            </Field>

            <Field label="Email Address" icon={Mail}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field !pl-11" required placeholder="student@atbu.edu.ng" />
            </Field>

            <Field label="Password" icon={Lock}>
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field !pl-11 !pr-11" required placeholder="••••••••" minLength={6} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>
            {password.length > 0 && (
              <div>
                <div className="flex gap-1 mb-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{ background: i <= strength ? strengthColor : "var(--border-color)" }} />
                  ))}
                </div>
                <p className="text-xs font-semibold" style={{ color: strengthColor }}>{strengthLabel}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Faculty</label>
                <input type="text" value={faculty} onChange={(e) => setFaculty(e.target.value)} className="input-field" placeholder="e.g. Science" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Level of Study</label>
                <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} className="input-field" placeholder="e.g. 400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Prior experience with AI tools</label>
              <select value={exposure} onChange={(e) => setExposure(e.target.value as PriorAIExposure)} className="input-field" required>
                <option value="" disabled>Select one…</option>
                {EXPOSURE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Consent */}
            <ConsentBox agreed={consent} onChange={setConsent} />

            <button type="submit" disabled={loading || !consent} className="btn-primary w-full !py-3.5 flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account & Begin <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-bold hover:underline" style={{ color: "var(--accent)" }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
        {children}
      </div>
    </div>
  );
}

function ConsentBox({ agreed, onChange }: { agreed: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-color)" }}>
      <h3 className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>Participant Information & Consent</h3>
      <div className="text-xs leading-relaxed space-y-2 max-h-40 overflow-y-auto pr-2" style={{ color: "var(--text-secondary)" }}>
        <p>
          <strong>Purpose.</strong> This platform is part of a final-year research study at Abubakar
          Tafawa Balewa University evaluating how an interactive system affects students&apos; ethical
          AI literacy.
        </p>
        <p>
          <strong>What is collected.</strong> Your registration details, your answers to a pre-test
          and post-test, your choices within learning scenarios, quiz responses, written reflections,
          and a short usability questionnaire.
        </p>
        <p>
          <strong>Anonymisation.</strong> Your name and email are never included in any exported
          research data. Analyses use a pseudonymous code, in line with the Nigeria Data Protection
          Act 2023 and the principle of data minimisation.
        </p>
        <p>
          <strong>Your rights.</strong> Participation is voluntary. You may withdraw at any time
          without penalty by contacting the researcher; your data can be removed on request.
        </p>
      </div>
      <label className="flex items-start gap-3 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-green-700 shrink-0"
        />
        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
          I have read and understood the information above and I consent to take part in this study.
        </span>
      </label>
    </div>
  );
}
