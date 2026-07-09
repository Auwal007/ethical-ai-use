"use client";

/**
 * Client-side auth/gating guard (UX layer over the middleware's hard gate).
 *
 * - Redirects unauthenticated users to /login (middleware already blocks the
 *   request, but this covers client-side navigations and shows a spinner).
 * - Enforces the pre-test hard-gate: an authenticated student who has not
 *   completed the pre-test is sent to /pretest from every protected page,
 *   mirroring the backend gating so they never hit a raw 403.
 * - Optional role requirement for admin pages.
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";
import { SkeletonDashboard } from "@/components/ui/Skeleton";

interface Props {
  children: React.ReactNode;
  /** Require an admin role for this subtree. */
  requireAdmin?: boolean;
  /** Skip the pre-test redirect (used by /pretest itself). */
  allowWithoutPretest?: boolean;
}

export default function RequireAuth({
  children,
  requireAdmin = false,
  allowWithoutPretest = false,
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }

    if (requireAdmin && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    // Pre-test hard gate (students only; admins are exempt).
    if (
      !allowWithoutPretest &&
      user.role !== "admin" &&
      !user.pretest_completed &&
      pathname !== "/pretest"
    ) {
      router.replace("/pretest");
    }
  }, [loading, user, requireAdmin, allowWithoutPretest, pathname, router]);

  // While resolving, or about to redirect, show a skeleton rather than flashing.
  if (loading || !user) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <SkeletonDashboard />
      </div>
    );
  }
  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <SkeletonDashboard />
      </div>
    );
  }

  return <>{children}</>;
}
