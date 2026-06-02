'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  ChevronDown, Brain, Shield, BookOpen, Target,
  Award, FileText, Lock, Scale, Layers,
  Activity, Users, AlertTriangle, CheckCircle,
  Eye, MonitorPlay, Zap, LayoutDashboard,
  Check, PlayCircle, Trophy
} from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen relative w-full overflow-hidden">
      {/* Background Texture - Adire Motif */}
      <div className="fixed inset-0 w-full h-full opacity-5 pointer-events-none z-0" style={{ background: 'var(--cream)' }}>
        <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="adire-bg" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect x="10" y="10" width="10" height="10" fill="var(--green)"/>
              <rect x="40" y="10" width="10" height="10" fill="var(--green)"/>
              <rect x="25" y="25" width="10" height="10" fill="var(--gold)"/>
              <rect x="10" y="40" width="10" height="10" fill="var(--brown)"/>
              <rect x="40" y="40" width="10" height="10" fill="var(--brown)"/>
              <line x1="0" y1="0" x2="60" y2="60" stroke="var(--green)" strokeWidth="0.5"/>
              <line x1="60" y1="0" x2="0" y2="60" stroke="var(--gold)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#adire-bg)"/>
        </svg>
      </div>

      <main className="flex-1 relative z-10 w-full">

        {/* SECTION 1: HERO SECTION */}
        <section className="relative pt-20 pb-32 px-6 lg:px-12 flex flex-col items-center justify-center text-center min-h-[90vh]">
          {/* Subtle floating academic-themed visual elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Brain className="absolute top-[20%] left-[10%] w-12 h-12 text-green-700 opacity-10 animate-float" />
            <Shield className="absolute top-[30%] right-[15%] w-16 h-16 text-yellow-600 opacity-10 animate-float delay-100" />
            <BookOpen className="absolute bottom-[20%] left-[20%] w-10 h-10 text-amber-700 opacity-10 animate-float delay-200" />
            <Target className="absolute bottom-[30%] right-[10%] w-14 h-14 text-green-800 opacity-10 animate-float delay-300" />
          </div>

          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 border px-4 py-1.5 rounded-full mb-8" style={{ borderColor: 'rgba(184,150,12,0.5)', background: 'var(--warning-bg)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--brown)' }}>
                ATBU AI Literacy: Ethical AI Learning Environment
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-bold leading-tight mb-6 font-heading" style={{ color: 'var(--text-primary)' }}>
              Master the <em className="italic font-light" style={{ color: 'var(--green)' }}>Ethics</em> of <br />
              <span style={{ color: 'var(--gold)' }}>Artificial</span> Intelligence
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
              A dedicated digital learning environment designed to equip students with the knowledge, critical thinking skills, and ethical awareness required to navigate the age of Generative AI responsibly.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
              <Link href="/register" className="btn-primary !px-8 !py-4 text-lg">
                Start Learning
              </Link>
              <Link href="#curriculum" className="btn-secondary !px-8 !py-4 text-lg bg-white">
                Explore Curriculum
              </Link>
            </div>

            {/* Trust Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
              {[
                { icon: MonitorPlay, text: 'Interactive Learning' },
                { icon: Layers, text: 'Scenario-Based Training' },
                { icon: Activity, text: 'Progress Tracking' },
                { icon: Shield, text: 'Academic Integrity Focus' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <item.icon className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: WHY THIS PLATFORM EXISTS */}
        <section className="py-24 px-6 lg:px-12 bg-white" id="why-it-matters">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold font-heading mb-6" style={{ color: 'var(--green)' }}>Why AI Literacy Matters</h2>
              <p className="text-lg max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                As AI tools become increasingly integrated into education and society, students require structured guidance to use these technologies responsibly and effectively.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: AlertTriangle, title: 'AI-Generated Misinformation', desc: 'Inability to distinguish fact from AI fabrication.' },
                { icon: FileText, title: 'Hallucinated Citations', desc: 'Risk of referencing non-existent academic sources.' },
                { icon: Scale, title: 'Academic Dishonesty Risks', desc: 'Unintentional plagiarism and integrity violations.' },
                { icon: Lock, title: 'Privacy Concerns', desc: 'Sharing sensitive personal or research data with AI.' },
                { icon: Eye, title: 'Algorithmic Bias', desc: 'Uncritical acceptance of biased AI outputs.' },
                { icon: Brain, title: 'Lack of Ethical Awareness', desc: 'Missing the moral implications of AI decision-making.' },
              ].map((challenge, i) => (
                <div key={i} className="card p-8 rounded-xl flex flex-col gap-4 hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2" style={{ background: 'var(--warning-bg)', color: 'var(--brown)' }}>
                    <challenge.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-heading" style={{ color: 'var(--black)' }}>{challenge.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{challenge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: PROJECT OBJECTIVES */}
        <section className="py-24 px-6 lg:px-12" style={{ background: 'var(--cream)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <span className="text-sm font-bold tracking-widest uppercase mb-4 block" style={{ color: 'var(--gold)' }}>Our Goals</span>
              <h2 className="text-4xl font-bold font-heading" style={{ color: 'var(--black)' }}>Project Objectives</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: 'Ethical Awareness', desc: 'Develop understanding of fairness, privacy, transparency, and accountability in AI systems.' },
                { title: 'Critical Evaluation', desc: 'Enable learners to identify hallucinations, misinformation, and unreliable AI outputs.' },
                { title: 'Responsible Usage', desc: 'Promote ethical and academically acceptable AI practices.' },
                { title: 'Decision-Making Skills', desc: 'Strengthen students\' ability to evaluate real-world AI dilemmas.' },
                { title: 'Digital Literacy', desc: 'Build competence in interacting with modern AI technologies.' },
                { title: 'Social Impact', desc: 'Encourage the use of AI for positive societal outcomes.' },
              ].map((obj, i) => (
                <div key={i} className="glass-card p-8 rounded-2xl flex gap-6 items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm mt-1" style={{ background: 'var(--green)', color: 'white' }}>
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 font-heading" style={{ color: 'var(--green)' }}>{obj.title}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>{obj.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: LEARNING CURRICULUM */}
        <section className="py-24 px-6 lg:px-12 bg-white" id="curriculum">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold font-heading mb-6" style={{ color: 'var(--black)' }}>Structured Learning Journey</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                A carefully designed roadmap taking you from foundational concepts to advanced ethical reasoning.
              </p>
            </div>

            <div className="relative border-l-2 ml-4 md:ml-8 space-y-12 pb-12" style={{ borderColor: 'var(--green-pale)' }}>
              {[
                {
                  title: 'Ethical Awareness',
                  duration: '2 Hours', difficulty: 'Beginner',
                  topics: ['Privacy', 'Bias', 'Transparency', 'Hallucinations'],
                  status: 'Active'
                },
                {
                  title: 'Critical Evaluation',
                  duration: '3 Hours', difficulty: 'Intermediate',
                  topics: ['Fact-checking', 'Citation verification', 'Misinformation detection'],
                  status: 'Active'
                },
                {
                  title: 'AI for Social Good',
                  duration: '2.5 Hours', difficulty: 'Advanced',
                  topics: ['Real-world case studies', 'Community impact', 'Responsible innovation'],
                  status: 'Active'
                }
              ].map((mod, i) => (
                <div key={i} className="relative pl-8 md:pl-12">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white" style={{ background: 'var(--green)' }} />
                  <div className="card p-6 md:p-8 rounded-xl">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs font-bold tracking-wider uppercase mb-2 block" style={{ color: 'var(--gold)' }}>Module {i + 1}</span>
                        <h3 className="text-2xl font-bold font-heading" style={{ color: 'var(--green)' }}>{mod.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 font-medium" style={{ color: 'var(--black)' }}>{mod.duration}</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 font-medium" style={{ color: 'var(--black)' }}>{mod.difficulty}</span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--black)' }}>Key Topics:</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mod.topics.map((topic, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <CheckCircle className="w-4 h-4" style={{ color: 'var(--green)' }} />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}

              <div className="relative pl-8 md:pl-12 opacity-60">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white bg-gray-300" />
                <div className="card p-6 rounded-xl border-dashed">
                  <h3 className="text-xl font-bold font-heading mb-4 text-gray-500">Future Modules</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Prompt Engineering', 'AI Governance', 'AI in Education', 'Emerging AI Risks'].map((topic, j) => (
                      <span key={j} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: INTERACTIVE LEARNING EXPERIENCE */}
        <section className="py-24 px-6 lg:px-12" style={{ background: 'var(--green)', color: 'white' }}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 md:text-center">
              <h2 className="text-4xl font-bold font-heading mb-6">Learn Through Experience</h2>
              <p className="text-lg max-w-2xl mx-auto text-green-100">
                Move beyond theory with hands-on, practical applications of ethical AI principles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Interactive Scenarios', desc: 'Students analyze realistic ethical dilemmas.', icon: Layers },
                { title: 'Knowledge Quizzes', desc: 'Immediate feedback and reinforcement.', icon: CheckCircle },
                { title: 'Progress Tracking', desc: 'Visual learning progress and achievements.', icon: Activity },
                { title: 'Gamification', desc: 'XP points, badges, and milestones.', icon: Trophy },
                { title: 'Reflection Exercises', desc: 'Critical thinking activities after each lesson.', icon: Brain },
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-xl border border-green-800 hover:bg-white/10 transition-colors backdrop-blur-sm group" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <feature.icon className="w-10 h-10 mb-6 group-hover:scale-110 transition-transform" style={{ color: 'var(--gold-light)' }} />
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--green-pale)' }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: PLATFORM FEATURES */}
        <section className="py-24 px-6 lg:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold font-heading mb-6" style={{ color: 'var(--black)' }}>Powerful Learning Tools</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'AI Ethics Simulator', 'Interactive Quizzes', 'Achievement System', 'Learning Analytics Dashboard',
                'Progress Monitoring', 'Adaptive Recommendations', 'Certification System', 'Leaderboards'
              ].map((feat, i) => (
                <div key={i} className="card p-6 flex flex-col items-center justify-center text-center gap-4 rounded-xl min-h-[160px]">
                  <Zap className="w-6 h-6 opacity-50" style={{ color: 'var(--gold)' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--green)' }}>{feat}</span>
                </div>
              ))}
            </div>

            {/* Mockup Placeholder */}
            <div className="mt-16 w-full h-64 md:h-96 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shadow-inner">
              <div className="flex flex-col items-center text-gray-400">
                <LayoutDashboard className="w-12 h-12 mb-4 opacity-50" />
                <span className="font-medium tracking-widest uppercase text-sm">Platform Dashboard Interface Preview</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: HOW IT WORKS */}
        <section className="py-24 px-6 lg:px-12" style={{ background: 'var(--cream)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold font-heading mb-6" style={{ color: 'var(--green)' }}>Simple Learning Process</h2>
            </div>

            <div className="flex flex-col md:flex-row justify-between relative z-10">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 -z-10" style={{ background: 'var(--border-color)' }} />

              {[
                { step: '1', title: 'Create an account', icon: Users },
                { step: '2', title: 'Complete learning modules', icon: BookOpen },
                { step: '3', title: 'Participate in interactive activities', icon: PlayCircle },
                { step: '4', title: 'Earn certification and track progress', icon: Award },
              ].map((flow, i) => (
                <div key={i} className="flex flex-col items-center text-center mb-8 md:mb-0 px-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-md bg-white" style={{ border: '2px solid var(--green)', color: 'var(--green)' }}>
                    <flow.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase mb-2 block" style={{ color: 'var(--gold)' }}>Step {flow.step}</span>
                  <h3 className="font-bold text-sm max-w-[160px]" style={{ color: 'var(--black)' }}>{flow.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8: IMPACT AND BENEFITS */}
        <section className="py-24 px-6 lg:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold font-heading mb-16 text-center" style={{ color: 'var(--black)' }}>Educational Impact</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
              <div className="glass-card p-10 rounded-2xl border-t-4" style={{ borderTopColor: 'var(--green)' }}>
                <h3 className="text-2xl font-bold mb-8 font-heading" style={{ color: 'var(--green)' }}>For Students</h3>
                <ul className="space-y-4">
                  {['Ethical AI understanding', 'Better academic integrity', 'Critical thinking skills', 'Responsible technology use'].map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <Check className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-10 rounded-2xl border-t-4" style={{ borderTopColor: 'var(--brown)' }}>
                <h3 className="text-2xl font-bold mb-8 font-heading" style={{ color: 'var(--brown)' }}>For Institutions</h3>
                <ul className="space-y-4">
                  {['Digital literacy enhancement', 'AI policy awareness', 'Ethical technology adoption', 'Improved learning outcomes'].map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <Check className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { val: '3', label: 'Core Modules' },
                { val: '20+', label: 'Learning Activities' },
                { val: '50+', label: 'Ethical Scenarios' },
                { val: '100%', label: 'Self-Paced Learning' }
              ].map((stat, i) => (
                <div key={i} className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="text-4xl font-bold font-heading mb-2" style={{ color: 'var(--green)' }}>{stat.val}</div>
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 9: FINAL YEAR PROJECT HIGHLIGHT */}
        <section className="py-24 px-6 lg:px-12 border-y" style={{ background: 'var(--cream)', borderColor: 'var(--border-color)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-sm font-bold tracking-widest uppercase mb-4 block" style={{ color: 'var(--brown)' }}>Official Showcase</span>
              <h2 className="text-4xl font-bold font-heading" style={{ color: 'var(--green)' }}>Academic Project Overview</h2>
            </div>

            <div className="space-y-8">
              <div className="card p-8 rounded-xl shadow-sm bg-white">
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-red-800">Problem Statement</h3>
                <p className="text-lg leading-relaxed text-gray-700 border-l-4 border-red-800 pl-4">
                  Many students use AI tools without sufficient understanding of ethical implications and responsible practices.
                </p>
              </div>

              <div className="card p-8 rounded-xl shadow-sm bg-white">
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-green-800">Proposed Solution</h3>
                <p className="text-lg leading-relaxed text-gray-700 border-l-4 border-green-800 pl-4">
                  A comprehensive AI literacy platform focused on ethical awareness, critical evaluation, and responsible AI usage.
                </p>
              </div>

              <div className="card p-8 rounded-xl shadow-sm bg-white">
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-amber-600">Expected Contribution</h3>
                <p className="text-lg leading-relaxed text-gray-700 border-l-4 border-amber-500 pl-4">
                  Improving digital literacy and ethical technology adoption within higher education environments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: SUPERVISOR & DEPARTMENT SECTION */}
        <section className="py-16 px-6 lg:px-12 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-heading text-center mb-10" style={{ color: 'var(--black)' }}>Project Information</h2>

            <div className="card border-2 p-8 md:p-12 rounded-2xl relative overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
              {/* Decorative watermark */}
              <div className="absolute -right-20 -bottom-20 opacity-[0.03] pointer-events-none">
                <Award className="w-96 h-96 text-black" />
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  { label: 'Institution', value: 'Abubakar Tafawa Balewa University' },
                  { label: 'Department', value: 'Management Information Technology' },
                  { label: 'Project Type', value: 'Final Year Project' },
                  { label: 'Academic Session', value: '(placeholder)' },
                  { label: 'Student Name', value: '(placeholder)' },
                  { label: 'Supervisor', value: '(placeholder)' }
                ].map((info, i) => (
                  <div key={i} className="border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{info.label}</div>
                    <div className="font-medium text-sm md:text-base" style={{ color: 'var(--black)' }}>{info.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 11: TESTIMONIALS (Expected Learning Outcomes) */}
        <section className="py-24 px-6 lg:px-12" style={{ background: 'var(--green-pale)' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold font-heading text-center mb-16" style={{ color: 'var(--green)' }}>Expected Learning Outcomes</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                "Students become more confident in identifying AI-generated misinformation.",
                "Students develop stronger ethical reasoning skills.",
                "Learners understand responsible AI usage in academic environments."
              ].map((outcome, i) => (
                <div key={i} className="bg-white p-8 rounded-xl shadow-md relative">
                  <div className="text-6xl text-gray-200 absolute top-4 left-4 font-serif leading-none">&quot;</div>
                  <p className="relative z-10 text-lg italic text-gray-700 pt-6 font-heading">
                    {outcome}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 12: FAQ SECTION */}
        <section className="py-24 px-6 lg:px-12 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-heading text-center mb-12" style={{ color: 'var(--black)' }}>Frequently Asked Questions</h2>

            <div className="space-y-4">
              {[
                { q: "What is AI Literacy?", a: "AI Literacy is the ability to understand, use, and evaluate artificial intelligence technologies critically and ethically." },
                { q: "Why is AI Ethics important?", a: "It ensures AI is used fairly, transparently, and responsibly, avoiding harms like bias, privacy violations, and misinformation." },
                { q: "Who can use this platform?", a: "The platform is primarily designed for university students, educators, and researchers seeking to navigate generative AI safely." },
                { q: "How long does it take to complete modules?", a: "Each core module takes approximately 2-3 hours, but the learning is entirely self-paced." },
                { q: "Will learners receive certificates?", a: "Yes, upon successful completion of core modules and assessments, users can earn a verifiable digital certificate." },
                { q: "How is progress tracked?", a: "Progress is monitored in real-time via your personalized learning dashboard, tracking XP, completed scenarios, and quiz scores." }
              ].map((faq, i) => (
                <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    onClick={() => toggleFaq(i)}
                  >
                    <span className="font-bold text-sm md:text-base" style={{ color: 'var(--black)' }}>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} style={{ color: 'var(--green)' }} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 py-4 bg-white">
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 13: FINAL CTA */}
        <section className="py-32 px-6 lg:px-12 text-center relative overflow-hidden" style={{ background: 'var(--green)' }}>
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at center, var(--gold) 0%, transparent 70%)' }} />

          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-white">
              Prepare for the Future of <span style={{ color: 'var(--gold-light)' }}>Responsible AI</span>
            </h2>
            <p className="text-lg md:text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Develop the skills, awareness, and critical thinking abilities required to engage with artificial intelligence responsibly.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="btn-primary !px-10 !py-5 text-lg font-bold shadow-2xl bg-white hover:bg-gray-100 !text-green-900 border-none">
                Start Learning Now
              </Link>
              <Link href="#curriculum" className="btn-secondary !px-10 !py-5 text-lg font-bold text-white border-white hover:bg-green-800">
                View Curriculum
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 pt-20 pb-10 px-6 lg:px-12 text-gray-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-heading text-white mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6" style={{ color: 'var(--gold)' }} />
              ATBU AI Ethics
            </h3>
            <p className="text-sm leading-relaxed">
              A final-year project dedicated to advancing AI literacy and ethical technology use in higher education.
            </p>
            <div className="pt-4 border-t border-gray-800">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Institution</p>
              <p className="text-sm text-gray-300">Abubakar Tafawa Balewa University</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#about" className="hover:text-white transition-colors">About Project</Link></li>
              <li><Link href="#curriculum" className="hover:text-white transition-colors">Learning Modules</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Information</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#info" className="hover:text-white transition-colors">Department Info</Link></li>
              <li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">GitHub Repository</a></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Department</h4>
            <div className="card bg-gray-800 border-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300 font-medium">Management Information Technology</p>
              <p className="text-xs mt-2 text-gray-500">School of Management Technology</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} ATBU AI Literacy Platform. Final Year Project.</p>
          <div className="flex gap-4">
            <span className="px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">Educational Purpose Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
