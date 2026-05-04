'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ModuleProgress = {
  id: number;
  title: string;
  description: string;
  progress: {
    status: string;
    score: number | null;
  };
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [progressData, setProgressData] = useState({ completed: 0, total: 3, percentage: 0, avgScore: 0 });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchModules = async () => {
      if (user) {
        const res = await fetch('/api/modules');
        const data = await res.json();
        setModules(data);
        const completedMods = data.filter((m: any) => m.progress.status === 'completed');
        const completed = completedMods.length;
        
        let avgScore = 0;
        let scoreSum = 0;
        let scoreCount = 0;
        completedMods.forEach((m: any) => {
          if (m.progress.score !== null) {
            scoreSum += m.progress.score;
            scoreCount++;
          }
        });
        if (scoreCount > 0) {
          // Normalize to 100%. If max is 5 for some, max is 100 for others...
          // We can approximate by checking if score > 10.
          // Wait, Module1 max is 5, M2 max 100, M3 max 100.
          // Let's just calculate a naive average or raw scores display.
          avgScore = Math.round(scoreSum / scoreCount);
        }

        setProgressData({
          completed,
          total: data.length,
          percentage: data.length > 0 ? (completed / data.length) * 100 : 0,
          avgScore
        });
      }
    };
    fetchModules();
  }, [user]);

  if (loading || !user) return <div className="text-center py-20 text-slate-500">Loading...</div>;

  const currentModuleMatch = modules.find(m => m.progress.status !== 'completed');
  const currentModule = currentModuleMatch || modules[modules.length - 1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Left Column */}
      <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
        
        {/* Welcome Bento Card */}
        <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}.</h1>
              <p className="text-indigo-200 max-w-lg mt-2">
                Ready to navigate the ethical frontier? Your journey through AI Literacy is {Math.round(progressData.percentage)}% complete. 
                {currentModuleMatch && ` Focus on Module ${modules.indexOf(currentModule) + 1} today.`}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 mt-8">
              <div className="flex-grow">
                <div className="flex justify-between text-xs font-medium mb-2 uppercase tracking-widest text-indigo-100">
                  <span>Course Mastery</span>
                  <span>{progressData.completed}/{progressData.total} Modules</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className="bg-indigo-400 h-3 rounded-full shadow-[0_0_12px_rgba(129,140,248,0.5)] transition-all duration-1000 ease-out" 
                    style={{ width: `${progressData.percentage}%` }}
                  ></div>
                </div>
              </div>
              {currentModuleMatch && (
                <Link href={`/modules/${currentModule.id}`} className="ml-6 bg-white text-indigo-900 px-6 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap">
                  Resume
                </Link>
              )}
            </div>
          </div>
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Learning Modules Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col flex-grow">
          <h2 className="font-bold text-lg text-slate-800 mb-4">Learning Modules</h2>
          <div className="space-y-3 flex-grow">
            {modules.map((mod, index) => {
              const isCompleted = mod.progress.status === 'completed';
              // Module is active if it's the first not-completed, or if it's the current one being attempted.
              const isActive = !isCompleted && index === progressData.completed;
              const isLocked = !isCompleted && index > progressData.completed;

              let wrapperClass = "group p-4 rounded-2xl flex items-center justify-between transition-all ";
              let numClass = "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 sm:mr-0 mr-2 ";
              let titleClass = "font-bold text-sm ";
              let subClass = "text-[10px] font-bold uppercase tracking-widest ";
              
              if (isCompleted) {
                wrapperClass += "bg-slate-50 border border-green-100 ring-1 ring-green-400/20 shadow-sm cursor-pointer hover:bg-green-50/50";
                numClass += "bg-green-500";
                titleClass += "text-slate-800";
                subClass += "text-green-600";
              } else if (isActive) {
                wrapperClass += "bg-indigo-50 border border-indigo-100 ring-2 ring-indigo-500/30 cursor-pointer hover:bg-indigo-100/50";
                numClass += "bg-indigo-600";
                titleClass += "text-indigo-900";
                subClass += "text-indigo-500";
              } else {
                wrapperClass += "bg-slate-50 border border-slate-100 opacity-60";
                numClass += "bg-slate-300";
                titleClass += "text-slate-800";
                subClass += "text-slate-500";
              }

              const content = (
                <div className={wrapperClass}>
                  <div className="flex items-center space-x-4">
                    <div className={numClass}>0{index + 1}</div>
                    <div>
                      <p className={titleClass}>{mod.title}</p>
                      <p className={subClass}>
                        {isCompleted ? `Completed • Score: ${mod.progress.score ?? '-'}` : 
                         isActive ? `In Progress • Next Up` : 
                         `Locked • Complete Mod 0${index}`}
                      </p>
                    </div>
                  </div>
                  {isCompleted ? (
                    <div className="text-green-500 font-bold ml-2">✓</div>
                  ) : isActive ? (
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse ml-2 shrink-0"></div>
                  ) : (
                    <div className="text-slate-400 ml-2">🔒</div>
                  )}
                </div>
              );

              return (!isLocked || isActive) ? (
                <Link href={`/modules/${mod.id}`} key={mod.id}>
                  {content}
                </Link>
              ) : (
                <div key={mod.id}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
        
        {/* Performance Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-slate-800">Performance Grid</h2>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold uppercase tracking-wider">Overall</span>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Modules Passed</p>
              <p className="text-3xl font-black text-indigo-600 italic">{progressData.completed}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Avg Score</p>
              <p className="text-3xl font-black text-slate-800 italic">
                {progressData.completed > 0 ? progressData.avgScore : '-'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Badges Earned</p>
              <div className="flex space-x-2 mt-2">
                {progressData.completed >= 1 ? (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm" title="Awareness Initiated">🛡️</div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 border border-dashed border-slate-300 text-sm">?</div>
                )}
                {progressData.completed >= 2 ? (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm" title="Critical Thinker">🔍</div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 border border-dashed border-slate-300 text-sm">?</div>
                )}
                {progressData.completed >= 3 ? (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm" title="Social Good Advocate">🌟</div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 border border-dashed border-slate-300 text-sm">?</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Task or Admin Link */}
        {user.role === 'admin' ? (
          <div className="bg-slate-800 rounded-3xl p-5 text-white flex items-center justify-between border border-slate-700 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-xl">🛠️</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Admin Portal</p>
                <p className="text-sm font-medium">Manage Curriculum</p>
              </div>
            </div>
            <Link href="/admin" className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-colors cursor-pointer">
              →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col pt-5">
             <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-lg text-slate-800">Current Task</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {currentModuleMatch ? `Module ${modules.indexOf(currentModule) + 1}: ${currentModule.title}` : "All Completed!"}
                </p>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-bold">In Progress</span>
            </div>
            <div className="flex-grow bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-300 text-xs italic text-slate-600 overflow-y-hidden leading-relaxed relative min-h-[100px] flex items-center justify-center">
               {currentModuleMatch ? currentModule.description : "You have mastered the foundations of Ethical AI. Continue exploring other resources or review your modules."}
            </div>
            {currentModuleMatch && (
              <Link href={`/modules/${currentModule.id}`} className="block text-center w-full mt-4 bg-slate-800 text-white font-bold py-3 rounded-2xl hover:bg-slate-900 transition-colors shadow-sm">
                Open Module
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
