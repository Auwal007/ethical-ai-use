'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="flex-1 flex flex-col relative w-full h-full">
      {/* Background Texture - Adire Motif */}
      <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none z-0" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="adire" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect x="10" y="10" width="10" height="10" fill="var(--green)"/>
            <rect x="40" y="10" width="10" height="10" fill="var(--green)"/>
            <rect x="25" y="25" width="10" height="10" fill="var(--gold)"/>
            <rect x="10" y="40" width="10" height="10" fill="var(--brown)"/>
            <rect x="40" y="40" width="10" height="10" fill="var(--brown)"/>
            <line x1="0" y1="0" x2="60" y2="60" stroke="var(--green)" strokeWidth="0.5"/>
            <line x1="60" y1="0" x2="0" y2="60" stroke="var(--gold)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#adire)"/>
      </svg>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] relative z-10 w-full max-w-[1600px] mx-auto">
        {/* Left Column: Hero Copy */}
        <section className="flex flex-col justify-center py-12 lg:py-20 px-6 lg:px-12 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--border-color)' }}>
          <div className="inline-flex items-center gap-2 border px-4 py-1.5 rounded mb-10 w-fit" style={{ borderColor: 'rgba(184,150,12,0.5)', background: 'var(--warning-bg)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
            <span className="text-[11px] font-medium tracking-[0.12em] uppercase" style={{ color: 'var(--brown)' }}>
              Interactive AI Ethics Education
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-[56px] font-bold leading-[1.1] mb-6 font-heading" style={{ color: 'var(--text-primary)' }}>
            Master the<br/>
            <em className="italic" style={{ color: 'var(--green)' }}>Ethics</em> of<br/>
            <span style={{ color: 'var(--gold)' }}>Artificial</span><br/>
            Intelligence
          </h1>
          
          <p className="text-base leading-[1.8] max-w-[440px] mb-12" style={{ color: 'var(--text-secondary)' }}>
            A dedicated digital learning environment equipping ATBU scholars to navigate generative AI with critical thinking, academic integrity, and technological responsibility.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/register" className="btn-primary !px-8 !py-4 font-medium" style={{ boxShadow: '0 4px 14px rgba(26,92,42,0.2)' }}>
              Start Learning Free &rarr;
            </Link>
            <Link href="/login" className="btn-secondary !px-7 !py-3.5 font-medium border-[1.5px]" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>
              Student Login
            </Link>
          </div>
          <div className="w-[60px] h-[2px] mt-12 opacity-50" style={{ background: 'var(--gold)' }} />
        </section>

        {/* Right Column: Modules & Stats */}
        <section className="flex flex-col justify-between py-12 lg:py-16 px-6 lg:px-12" style={{ background: 'rgba(26,92,42,0.02)' }}>
          <div className="mb-12" id="modules">
            <div className="text-[11px] font-medium tracking-[0.15em] uppercase border-b pb-2 mb-5" style={{ color: 'var(--text-secondary)', borderColor: 'rgba(139,101,48,0.2)' }}>
              Core Modules
            </div>
            
            <div className="flex flex-col gap-2.5">
              {[
                { num: '01', title: 'Ethical Awareness', desc: 'Privacy, bias & AI hallucinations', pill: 'Foundational', color: 'var(--green)' },
                { num: '02', title: 'Critical Evaluation', desc: 'Spotting fake citations & errors', pill: 'Interactive', color: 'var(--gold)' },
                { num: '03', title: 'AI for Social Good', desc: 'Scenario-based decision making', pill: 'Applied', color: 'var(--brown)' }
              ].map((mod, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded border border-l-4 transition-all hover:translate-x-2" style={{ borderColor: 'rgba(139,101,48,0.15)', borderLeftColor: mod.color, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div className="font-heading font-bold text-xl w-7 shrink-0" style={{ color: mod.color }}>{mod.num}</div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--black)' }}>{mod.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{mod.desc}</div>
                  </div>
                  <div className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'var(--green-pale)', color: 'var(--green)' }}>
                    {mod.pill}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="features">
            <div className="text-[11px] font-medium tracking-[0.15em] uppercase border-b pb-2 mb-5" style={{ color: 'var(--text-secondary)', borderColor: 'rgba(139,101,48,0.2)' }}>
              Platform Features
            </div>
            <div className="grid grid-cols-2 gap-[1px] rounded border overflow-hidden" style={{ background: 'rgba(139,101,48,0.15)', borderColor: 'rgba(139,101,48,0.15)' }}>
              {[
                { val: '3', label: 'Core Modules', color: 'var(--green)' },
                { val: 'XP', label: 'Gamified Dashboard', color: 'var(--gold)' },
                { val: 'Live', label: 'Progress Tracking', color: 'var(--brown)' },
                { val: '100%', label: 'Interactive Scenarios', color: 'var(--green)' }
              ].map((stat, i) => (
                <div key={i} className="p-6 bg-white hover:bg-opacity-90 transition-colors" style={{ background: 'var(--cream)' }}>
                  <div className="font-heading font-bold text-3xl sm:text-4xl leading-none" style={{ color: stat.color }}>{stat.val}</div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.05em] mt-2" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t py-5 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 bg-white">
        <span className="text-[13px] font-medium tracking-[0.02em]" style={{ color: 'var(--text-secondary)' }}>
          Abubakar Tafawa Balewa University &middot; Bauchi, Nigeria
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-medium px-3 py-1 rounded border" style={{ background: 'var(--warning-bg)', color: 'var(--text-secondary)', borderColor: 'rgba(184,150,12,0.4)' }}>
            Interactive Platform
          </span>
          <span className="text-[11px] font-medium px-3 py-1 rounded border" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'rgba(26,92,42,0.3)' }}>
            Personalized Dashboard
          </span>
          <span className="text-[11px] font-medium px-3 py-1 rounded border hidden sm:block" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'rgba(26,92,42,0.3)' }}>
            Real-time Feedback
          </span>
        </div>
      </footer>
    </div>
  );
}
