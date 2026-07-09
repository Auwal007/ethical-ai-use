"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/** Global error boundary for the app router. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for debugging; production logging can hook in here.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card-static rounded-3xl p-10 text-center max-w-md">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--danger)" }} />
        <h1 className="text-xl font-bold font-heading" style={{ color: "var(--text-primary)" }}>
          Something went wrong
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
