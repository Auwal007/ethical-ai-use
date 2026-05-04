'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [progressData, setProgressData] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      } else {
        fetchAdminData();
      }
    }
  }, [user, loading, router]);

  const fetchAdminData = async () => {
    const res = await fetch('/api/progress');
    if (res.ok) {
      const data = await res.json();
      setProgressData(data);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return <div className="text-center py-20 text-gray-500">Loading admin interface...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor student progress across all modules.</p>
        </div>
      </div>

      <div className="bg-white border text-left border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Student</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Module</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Score</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {progressData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{row.user_name}</div>
                    <div className="text-sm text-slate-500">{row.user_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{row.module_title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                      row.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      row.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {row.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">
                    {row.score !== null ? row.score : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {progressData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                    No student progress recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
