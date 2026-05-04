'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { Zap, Flame, Trophy, Target, ArrowRight, CheckCircle, Lock, ChevronRight, Crown } from 'lucide-react';

type ModuleProgress = {
  id: number;
  title: string;
  description: string;
  progress: { status: string; score: number | null };
};

type LeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  modules_completed: number;
};

function ProgressRing({ percentage, size = 100, stroke = 8 }: { percentage: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="progress-ring-circle"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [progressData, setProgressData] = useState({ completed: 0, total: 3, percentage: 0, avgScore: 0 });
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      try {
        const [modRes, lbRes] = await Promise.all([
          fetch('/api/modules'),
          fetch('/api/leaderboard'),
        ]);
        const modData = await modRes.json();
        const lbData = await lbRes.json();
        setModules(modData);
        setLeaderboard(lbData);

        const completedMods = modData.filter((m: any) => m.progress.status === 'completed');
        const completed = completedMods.length;
        let scoreSum = 0, scoreCount = 0;
        completedMods.forEach((m: any) => {
          if (m.progress.score !== null) {
            // Normalize Module 1 scores (out of 5) to percentage
            const normalized = m.id === 1 ? (m.progress.score / 5) * 100 : m.progress.score;
            scoreSum += normalized;
            scoreCount++;
          }
        });

        setProgressData({
          completed,
          total: modData.length,
          percentage: modData.length > 0 ? (completed / modData.length) * 100 : 0,
          avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
        });
        setDataLoaded(true);
      } catch { setDataLoaded(true); }
    };
    fetchAll();
  }, [user]);

  if (loading || !user) return <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full"><SkeletonDashboard /></div>;
  if (!dataLoaded) return <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full"><SkeletonDashboard /></div>;

  const currentModule = modules.find(m => m.progress.status !== 'completed');
  const xp = user.xp || 0;
  const level = user.level || { name: 'Novice', number: 1, nextXp: 50 };
  const xpProgress = level.nextXp > 0 ? Math.min(100, (xp / level.nextXp) * 100) : 100;

  const badges = [
    { emoji: '🛡️', name: 'Awareness Initiated', unlocked: progressData.completed >= 1, bg: 'from-orange-400 to-amber-500' },
    { emoji: '🔍', name: 'Critical Thinker', unlocked: progressData.completed >= 2, bg: 'from-blue-400 to-indigo-500' },
    { emoji: '🌟', name: 'Social Good Advocate', unlocked: progressData.completed >= 3, bg: 'from-purple-400 to-pink-500' },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">

        {/* ===== LEFT COLUMN ===== */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Welcome Hero Card */}
          <div className="rounded-3xl p-8 text-white relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 shadow-xl">
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider">Welcome back</p>
                  <h1 className="text-3xl sm:text-4xl font-extrabold mt-1 font-heading">{user.name.split(' ')[0]}! 👋</h1>
                  <p className="text-indigo-200 mt-2 max-w-md">
                    {progressData.completed === progressData.total
                      ? 'Congratulations! You\'ve mastered all modules. You\'re an AI ethics champion!'
                      : `You're ${Math.round(progressData.percentage)}% through your journey. Keep going!`}
                  </p>
                </div>
                {/* XP Level ring */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative">
                    <ProgressRing percentage={xpProgress} size={88} stroke={6} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black font-heading">{xp}</span>
                      <span className="text-[10px] uppercase tracking-wider text-indigo-200">XP</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold mt-2 text-indigo-200">{level.name}</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { icon: Target, label: 'Completed', value: `${progressData.completed}/${progressData.total}` },
                  { icon: Flame, label: 'Streak', value: `${user.streak || 0} days` },
                  { icon: Trophy, label: 'Avg Score', value: progressData.avgScore > 0 ? `${progressData.avgScore}%` : '-' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                    <stat.icon className="h-4 w-4 text-indigo-300 mb-1" />
                    <p className="text-lg font-bold font-heading">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-indigo-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-400/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />
          </div>

          {/* Learning Modules */}
          <div className="card-static rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Learning Modules</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                {progressData.completed} of {progressData.total}
              </span>
            </div>
            <div className="space-y-3">
              {modules.map((mod, index) => {
                const isCompleted = mod.progress.status === 'completed';
                const isActive = !isCompleted && index === progressData.completed;
                const isLocked = !isCompleted && index > progressData.completed;

                return (
                  <div key={mod.id}>
                    {(isCompleted || isActive) ? (
                      <Link href={`/modules/${mod.id}`}>
                        <ModuleCard mod={mod} index={index} isCompleted={isCompleted} isActive={isActive} isLocked={false} />
                      </Link>
                    ) : (
                      <ModuleCard mod={mod} index={index} isCompleted={false} isActive={false} isLocked={isLocked} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Badges */}
          <div className="card-static rounded-3xl p-6">
            <h2 className="font-bold text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>Badges Earned</h2>
            <div className="space-y-3">
              {badges.map((badge, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-2xl transition-all" style={{ background: badge.unlocked ? 'var(--accent-bg)' : 'var(--bg-card-hover)', opacity: badge.unlocked ? 1 : 0.5 }}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${badge.unlocked ? `bg-gradient-to-br ${badge.bg} shadow-md` : ''}`}
                    style={!badge.unlocked ? { background: 'var(--border-color)' } : {}}>
                    {badge.unlocked ? badge.emoji : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{badge.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{badge.unlocked ? 'Unlocked' : 'Complete module to unlock'}</p>
                  </div>
                  {badge.unlocked && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card-static rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg font-heading" style={{ color: 'var(--text-primary)' }}>Leaderboard</h2>
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.rank} className="flex items-center space-x-3 p-2.5 rounded-xl transition-colors" style={{ background: entry.rank <= 3 ? 'var(--accent-bg)' : 'transparent' }}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' : entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : entry.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' : ''}`}
                      style={entry.rank > 3 ? { background: 'var(--border-color)', color: 'var(--text-muted)' } : {}}>
                      {entry.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{entry.name}</p>
                    </div>
                    <span className="text-xs font-bold flex items-center" style={{ color: 'var(--accent)' }}>
                      <Zap className="h-3 w-3 mr-0.5" />{entry.xp}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>Complete modules to appear here!</p>
            )}
          </div>

          {/* Admin portal link */}
          {user.role === 'admin' && (
            <Link href="/admin" className="card rounded-3xl p-5 flex items-center justify-between group bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-xl">🛠️</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Portal</p>
                  <p className="text-sm font-medium">Manage & Monitor</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Current task */}
          {!currentModule && progressData.completed === progressData.total && (
            <div className="card-static rounded-3xl p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-bold font-heading" style={{ color: 'var(--text-primary)' }}>All Complete!</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>You&apos;ve mastered all modules. Amazing work!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ mod, index, isCompleted, isActive, isLocked }: {
  mod: ModuleProgress; index: number; isCompleted: boolean; isActive: boolean; isLocked: boolean;
}) {
  const normalizedScore = mod.id === 1 && mod.progress.score !== null
    ? `${mod.progress.score}/5`
    : mod.progress.score !== null
      ? `${mod.progress.score}%`
      : '-';

  return (
    <div className={`group p-4 rounded-2xl flex items-center justify-between transition-all ${isLocked ? 'opacity-50' : 'cursor-pointer'}`}
      style={{
        background: isActive ? 'var(--accent-bg)' : isCompleted ? 'var(--success-bg)' : 'var(--bg-card-hover)',
        border: isActive ? '2px solid var(--accent)' : isCompleted ? '2px solid var(--success)' : '1px solid var(--border-color)',
      }}>
      <div className="flex items-center space-x-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${isCompleted ? 'bg-gradient-to-br from-emerald-400 to-green-600' : isActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-300'}`}>
          {isCompleted ? <CheckCircle className="h-5 w-5" /> : `0${index + 1}`}
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{mod.title}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: isCompleted ? 'var(--success-text)' : isActive ? 'var(--accent-text)' : 'var(--text-muted)' }}>
            {isCompleted ? `Completed • Score: ${normalizedScore}` : isActive ? 'In Progress • Start Now' : `Locked • Complete Module ${index}`}
          </p>
        </div>
      </div>
      <div className="shrink-0 ml-2">
        {isCompleted ? <CheckCircle className="h-5 w-5" style={{ color: 'var(--success)' }} /> :
         isActive ? <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--accent)' }} /> :
         <Lock className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
      </div>
    </div>
  );
}
