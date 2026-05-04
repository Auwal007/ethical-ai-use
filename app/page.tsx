'use client';

import Link from 'next/link';
import { ArrowRight, BrainCircuit, ShieldCheck, Search, Sparkles, Users, BookOpen, Award, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span className="stat-number">{count}{suffix}</span>;
}

export default function HomePage() {
  const features = [
    { icon: BrainCircuit, title: 'Algorithmic Bias', desc: 'Understand how AI systems inherit human biases and learn to critically evaluate their outputs.', color: 'from-violet-500 to-indigo-500', bg: 'var(--accent-bg)' },
    { icon: Search, title: 'Critical Evaluation', desc: 'Spot fake citations, AI hallucinations, and verify claims with hands-on detection exercises.', color: 'from-blue-500 to-cyan-500', bg: 'var(--success-bg)' },
    { icon: ShieldCheck, title: 'AI for Social Good', desc: 'Navigate real-world scenarios where AI ethics, privacy, and social impact intersect.', color: 'from-emerald-500 to-teal-500', bg: 'var(--warning-bg)' },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Register with your university email to get started', icon: Users },
    { num: '02', title: 'Learn & Practice', desc: 'Complete interactive modules with quizzes and scenarios', icon: BookOpen },
    { num: '03', title: 'Earn Recognition', desc: 'Track progress, earn XP, unlock badges and certificates', icon: Award },
  ];

  return (
    <div className="overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-bg min-h-[92vh] flex items-center justify-center relative px-4">
        {/* Animated orbs */}
        <div className="orb w-72 h-72 bg-indigo-500/30 top-20 left-[10%] animate-float-slow" style={{ animationDelay: '0s' }} />
        <div className="orb w-96 h-96 bg-purple-500/20 bottom-10 right-[5%] animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="orb w-48 h-48 bg-blue-500/25 top-[60%] left-[50%] animate-float-slow" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-indigo-200">ATBU Interactive Learning Platform</span>
          </div>

          {/* Main heading */}
          <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] font-heading tracking-tight">
            Master the Ethics of{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Artificial Intelligence
            </span>
          </h1>

          <p className="animate-fade-in-up delay-200 text-lg sm:text-xl text-indigo-200/90 max-w-2xl mx-auto leading-relaxed">
            An interactive platform designed to teach university students how to use AI tools ethically, critically, and responsibly in their academic journey.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register" className="group inline-flex items-center px-8 py-4 rounded-2xl bg-white text-indigo-900 font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5">
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="inline-flex items-center px-8 py-4 rounded-2xl border border-white/20 text-white font-bold text-lg hover:bg-white/10 backdrop-blur transition-all">
              Log In
            </Link>
          </div>

          {/* Stats bar */}
          <div className="animate-fade-in-up delay-400 flex flex-wrap items-center justify-center gap-8 pt-8">
            {[
              { value: 3, label: 'Modules', suffix: '' },
              { value: 15, label: 'Challenges', suffix: '+' },
              { value: 100, label: 'Interactive', suffix: '%' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-white font-heading">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs uppercase tracking-widest text-indigo-300/80 font-semibold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, var(--bg-body), transparent)' }} />
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>What You&apos;ll Learn</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading" style={{ color: 'var(--text-primary)' }}>
            Three Pillars of Ethical AI
          </h2>
          <p className="mt-4 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Interactive modules designed to build your ethical AI literacy from awareness through critical thinking to real-world application.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`card rounded-3xl p-8 group cursor-default animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                <f.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-heading" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              <div className="mt-6 flex items-center text-sm font-semibold group-hover:translate-x-1 transition-transform" style={{ color: 'var(--accent)' }}>
                Explore module <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 px-4" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading" style={{ color: 'var(--text-primary)' }}>
              Your Journey in Three Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative animate-fade-in-up" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="text-6xl font-black font-heading opacity-10 absolute -top-4 -left-2" style={{ color: 'var(--accent)' }}>
                  {step.num}
                </div>
                <div className="relative pt-8">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--accent-bg)' }}>
                    <step.icon className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 font-heading" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-static rounded-[2rem] p-12 sm:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 font-heading" style={{ color: 'var(--text-primary)' }}>
                Ready to become an <span className="gradient-text">AI-literate scholar?</span>
              </h2>
              <p className="mb-8 text-lg" style={{ color: 'var(--text-secondary)' }}>
                Join your fellow ATBU students in mastering the ethical use of AI. It&apos;s free, interactive, and takes less than an hour.
              </p>
              <Link href="/register" className="btn-primary text-lg !px-10 !py-4 inline-flex items-center">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">A</div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>ATBU Ethical AI Literacy System</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Abubakar Tafawa Balewa University. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
