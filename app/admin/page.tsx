'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, TrendingUp, Award, Search, ChevronDown, ArrowUpDown } from 'lucide-react';

type ProgressRow = {
  user_id: number;
  user_name: string;
  user_email: string;
  user_xp: number;
  module_id: number | null;
  module_title: string | null;
  status: string | null;
  score: number | null;
  completed_at: string | null;
};

type ModuleStat = { id: number; title: string; completions: number; avg_score: number | null };
type Stats = { totalStudents: number; completedModules: number; avgScore: number; moduleStats: ModuleStat[] };

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [progressData, setProgressData] = useState<ProgressRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'score' | 'date'>('name');
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login');
      else if (user.role !== 'admin') router.push('/dashboard');
      else fetchAdminData();
    }
  }, [user, loading, router]);

  const fetchAdminData = async () => {
    const res = await fetch('/api/progress');
    if (res.ok) {
      const data = await res.json();
      setProgressData(data.progress || data);
      setStats(data.stats || null);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton rounded-2xl h-28" />)}
        </div>
        <div className="skeleton rounded-3xl h-96" />
      </div>
    );
  }

  // Group progress by student
  const studentMap = new Map<number, { name: string; email: string; xp: number; rows: ProgressRow[] }>();
  progressData.forEach(row => {
    if (!studentMap.has(row.user_id)) {
      studentMap.set(row.user_id, { name: row.user_name, email: row.user_email, xp: row.user_xp || 0, rows: [] });
    }
    if (row.module_id) studentMap.get(row.user_id)!.rows.push(row);
  });

  const students = Array.from(studentMap.entries())
    .filter(([, s]) => {
      if (!searchQuery) return true;
      return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort(([, a], [, b]) => {
      if (sortField === 'name') return a.name.localeCompare(b.name);
      if (sortField === 'score') return b.xp - a.xp;
      return 0;
    });

  const completionRate = stats ? (stats.totalStudents > 0 ? Math.round((stats.completedModules / (stats.totalStudents * 3)) * 100) : 0) : 0;

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'from-blue-500 to-indigo-600' },
    { label: 'Modules Completed', value: stats?.completedModules || 0, icon: BookOpen, color: 'from-emerald-500 to-green-600' },
    { label: 'Avg Score', value: `${stats?.avgScore || 0}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: Award, color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-heading" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitor student progress and platform analytics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <div key={i} className="card-static rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black font-heading" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Module Performance Chart */}
      {stats?.moduleStats && stats.moduleStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Completions bar chart */}
          <div className="card-static rounded-3xl p-6">
            <h3 className="font-bold font-heading mb-6" style={{ color: 'var(--text-primary)' }}>Module Completions</h3>
            <div className="flex items-end gap-6 h-40">
              {stats.moduleStats.map((m, i) => {
                const maxCompletions = Math.max(...stats.moduleStats.map(ms => ms.completions), 1);
                const height = (m.completions / maxCompletions) * 100;
                const colors = ['from-blue-400 to-indigo-500', 'from-emerald-400 to-green-500', 'from-purple-400 to-pink-500'];
                return (
                  <div key={m.id} className="flex-1 flex flex-col items-center">
                    <span className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{m.completions}</span>
                    <div className="w-full rounded-t-xl chart-bar bg-gradient-to-t transition-all" style={{ height: `${Math.max(height, 8)}%`, animationDelay: `${i * 0.2}s` }}>
                      <div className={`w-full h-full rounded-t-xl bg-gradient-to-t ${colors[i]}`} />
                    </div>
                    <span className="text-[10px] font-semibold mt-2 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Mod {m.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Average scores */}
          <div className="card-static rounded-3xl p-6">
            <h3 className="font-bold font-heading mb-6" style={{ color: 'var(--text-primary)' }}>Average Scores</h3>
            <div className="space-y-4">
              {stats.moduleStats.map((m) => {
                const avg = m.avg_score || 0;
                const normalizedAvg = m.id === 1 ? (avg / 5) * 100 : avg;
                return (
                  <div key={m.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{m.title}</span>
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>{Math.round(normalizedAvg)}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full" style={{ background: 'var(--border-color)' }}>
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${normalizedAvg}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Student Progress Table */}
      <div className="card-static rounded-3xl overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="font-bold text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Student Progress</h3>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text" placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="input-field !pl-9 !py-2 !text-sm !rounded-xl sm:w-64"
              />
            </div>
            <button onClick={() => setSortField(sortField === 'name' ? 'score' : 'name')} className="btn-secondary !py-2 !px-3 !rounded-xl flex items-center gap-1 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortField === 'name' ? 'Name' : 'XP'}
            </button>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {students.length === 0 ? (
            <div className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              {searchQuery ? 'No students match your search.' : 'No student progress recorded yet.'}
            </div>
          ) : (
            students.map(([userId, student]) => (
              <div key={userId}>
                <div className="px-6 py-4 flex items-center justify-between cursor-pointer transition-colors hover:opacity-80"
                  onClick={() => setExpandedStudent(expandedStudent === userId ? null : userId)}
                  style={{ background: expandedStudent === userId ? 'var(--bg-card-hover)' : 'transparent' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{student.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{student.xp} XP</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{
                      background: student.rows.filter(r => r.status === 'completed').length === 3 ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: student.rows.filter(r => r.status === 'completed').length === 3 ? 'var(--success-text)' : 'var(--warning-text)',
                    }}>
                      {student.rows.filter(r => r.status === 'completed').length}/3
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedStudent === userId ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
                {/* Expanded detail */}
                {expandedStudent === userId && (
                  <div className="px-6 pb-4 animate-slide-down">
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                      {student.rows.length > 0 ? student.rows.map((row, i) => (
                        <div key={i} className="px-4 py-3 flex items-center justify-between text-sm" style={{ background: 'var(--bg-card)', borderBottom: i < student.rows.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.module_title}</span>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold`} style={{
                              background: row.status === 'completed' ? 'var(--success-bg)' : 'var(--warning-bg)',
                              color: row.status === 'completed' ? 'var(--success-text)' : 'var(--warning-text)',
                            }}>
                              {row.status || 'Pending'}
                            </span>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                              {row.score !== null ? row.score : '-'}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </div>
                      )) : (
                        <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No modules attempted yet</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
