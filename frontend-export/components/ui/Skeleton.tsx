'use client';

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card-static rounded-3xl p-6 space-y-4 ${className}`}>
      <div className="skeleton h-5 w-2/3 rounded-lg" />
      <div className="skeleton h-4 w-full rounded-lg" />
      <div className="skeleton h-4 w-4/5 rounded-lg" />
      <div className="skeleton h-10 w-1/3 rounded-xl mt-2" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="col-span-1 md:col-span-8 space-y-6">
        <div className="skeleton rounded-3xl h-52" />
        <div className="card-static rounded-3xl p-6 space-y-4">
          <div className="skeleton h-5 w-40 rounded-lg" />
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="col-span-1 md:col-span-4 space-y-6">
        <div className="skeleton rounded-3xl h-64" />
        <div className="skeleton rounded-3xl h-40" />
      </div>
    </div>
  );
}

export function SkeletonModule() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="card-static rounded-3xl p-8 space-y-4">
        <div className="skeleton h-7 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-5/6 rounded-lg" />
        <div className="skeleton h-64 w-full rounded-2xl mt-4" />
      </div>
    </div>
  );
}
