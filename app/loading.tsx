import { SkeletonDashboard } from "@/components/ui/Skeleton";

/** Global route-loading fallback, reusing the existing skeleton. */
export default function Loading() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <SkeletonDashboard />
    </div>
  );
}
