'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Module1 from '@/components/modules/Module1';
import Module2 from '@/components/modules/Module2';
import Module3 from '@/components/modules/Module3';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SingleModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const moduleId = parseInt(id);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const handleComplete = async (score: number) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          status: 'completed',
          score,
        }),
      });
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error('Failed to update progress');
    }
  };

  if (loading || !user) return <div className="text-center py-20">Loading module...</div>;

  return (
    <div>
      <div className="mb-6 max-w-3xl mx-auto">
        <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      {moduleId === 1 && <Module1 onComplete={handleComplete} />}
      {moduleId === 2 && <Module2 onComplete={handleComplete} />}
      {moduleId === 3 && <Module3 onComplete={handleComplete} />}
      
      {moduleId > 3 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 mt-8">
          <h2 className="text-2xl font-bold text-gray-800">Module Under Construction</h2>
          <p className="text-gray-500 mt-2">Check back later for new content.</p>
        </div>
      )}
    </div>
  );
}
