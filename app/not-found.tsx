import Link from "next/link";
import { Compass } from "lucide-react";

/** 404 page. */
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card-static rounded-3xl p-10 text-center max-w-md">
        <Compass className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-bold font-heading" style={{ color: "var(--text-primary)" }}>
          Page not found
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-block">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
