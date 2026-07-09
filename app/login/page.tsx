"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      const me = await refreshUser();
      addToast("Welcome back!", "success");
      const next = searchParams.get("next");
      // Send students who haven't done the pre-test straight to it.
      if (me && me.role !== "admin" && !me.pretest_completed) {
        router.push("/pretest");
      } else {
        router.push(next && next.startsWith("/") ? next : "/dashboard");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute w-96 h-96 rounded-full top-1/4 -left-48 opacity-20 animate-float-slow" style={{ background: "var(--accent)", filter: "blur(100px)" }} />
        <div className="absolute w-96 h-96 rounded-full bottom-1/4 -right-48 opacity-15 animate-float-slow" style={{ background: "#a855f7", filter: "blur(100px)", animationDelay: "3s" }} />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="card-static rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg" style={{ background: "var(--green)" }}>
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading" style={{ color: "var(--text-primary)" }}>Welcome back</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Enter your credentials to continue your journey
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "var(--danger-bg)", color: "var(--danger-text)" }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field !pl-11" required placeholder="student@atbu.edu.ng" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field !pl-11 !pr-11" required placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Log In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold hover:underline" style={{ color: "var(--accent)" }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
