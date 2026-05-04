'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import Module1 from '@/components/modules/Module1';
import Module2 from '@/components/modules/Module2';
import Module3 from '@/components/modules/Module3';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SkeletonModule } from '@/components/ui/Skeleton';

export default function SingleModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const moduleId = parseInt(id);
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const handleComplete = async (score: number) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId, status: 'completed', score }),
      });
      addToast(`Module completed! +${moduleId === 1 ? score * 20 : score} XP earned ⚡`, 'success');
      await refreshUser();
      router.push('/dashboard');
    } catch (e) {
      addToast('Failed to save progress. Please try again.', 'error');
    }
  };

  if (loading || !user) return <div className="p-4 sm:p-8 max-w-7xl mx-auto"><SkeletonModule /></div>;

  const titles: Record<number, string> = { 1: 'AI Ethical Awareness', 2: 'Critical Evaluation', 3: 'AI for Social Good' };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-6 max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-sm font-medium flex items-center w-fit transition hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
        </Link>
        {titles[moduleId] && (
          <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
            Module {moduleId}
          </span>
        )}
      </div>

      {moduleId === 1 && <Module1 onComplete={handleComplete} />}
      {moduleId === 2 && <Module2 onComplete={handleComplete} />}
      {moduleId === 3 && <Module3 onComplete={handleComplete} />}

      {moduleId > 3 && (
        <div className="text-center py-20 card-static rounded-3xl mt-8 max-w-3xl mx-auto">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>Module Under Construction</h2>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Check back later for new content.</p>
        </div>
      )}
    </div>
  );
}
