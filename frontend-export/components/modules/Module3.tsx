'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle, AlertTriangle, ShieldAlert, BookOpen, Lightbulb, Users, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

type Step = 'learn' | 'scenarios' | 'results';

const scenarios = [
  {
    title: "University Chatbot Deployment",
    description: "You are part of a student council deploying a new AI chatbot to help students navigate campus and handle mental health crises. How do you configure the mental health feature?",
    icon: Users,
    choices: [
      { text: "Automate everything. The AI should act as a therapist to save costs, keeping chat logs to learn and improve.", feedback: "Highly Unethical. AI should not act as a therapist due to hallucination risks. Storing sensitive logs without consent violates data privacy.", score: 0, type: 'danger' as const },
      { text: "Detect distress terms and automatically forward the full chat log to the nearest counselor.", feedback: "Partially Ethical. Protects from AI inaccuracies, but auto-forwarding private chats without consent still violates privacy.", score: 50, type: 'warning' as const },
      { text: "Detect distress terms, state it is an AI, provide emergency numbers, and ask if the user wants to be connected to a counselor.", feedback: "Ethical & Responsible. Transparent about AI nature, refrains from medical advice, and respects user autonomy by asking permission.", score: 100, type: 'success' as const },
    ],
  },
  {
    title: "AI-Powered Exam Proctoring",
    description: "Your university wants to implement AI-based exam proctoring that monitors students' faces, eye movements, and background sounds during online exams. You're asked to recommend an approach.",
    icon: Lock,
    choices: [
      { text: "Deploy full monitoring: webcam, microphone, screen recording, and browser lockdown with no opt-out.", feedback: "Highly Unethical. Maximum surveillance without consent or alternatives is invasive. It disproportionately impacts students with disabilities, non-traditional workspaces, or anxiety.", score: 0, type: 'danger' as const },
      { text: "Use AI monitoring but allow students to flag false positives after the exam. Store all recordings for 1 year.", feedback: "Partially Ethical. Post-exam appeals help, but storing recordings long-term creates privacy risks and puts burden on students to prove innocence.", score: 40, type: 'warning' as const },
      { text: "Combine minimal monitoring with alternative assessment options. Be transparent about what's tracked, allow opt-out to in-person exams, and delete data within 30 days.", feedback: "Ethical & Balanced. Respects privacy, provides alternatives, maintains transparency, and limits data retention — balancing academic integrity with student rights.", score: 100, type: 'success' as const },
    ],
  },
  {
    title: "AI Resume Screening Tool",
    description: "The university career center wants to use an AI tool to screen student resumes and match them with job opportunities. During testing, you notice it ranks male engineering students significantly higher. What do you recommend?",
    icon: Lightbulb,
    choices: [
      { text: "Deploy it anyway — the AI is probably reflecting real hiring trends and will help students get jobs faster.", feedback: "Highly Unethical. Deploying a biased tool perpetuates discrimination. 'Reflecting trends' means reinforcing systemic bias, not providing fair opportunities.", score: 0, type: 'danger' as const },
      { text: "Add a disclaimer that the tool may have biases and let students choose whether to use it.", feedback: "Partially Ethical. Transparency helps, but still exposes students to biased rankings. A disclaimer doesn't fix the underlying discrimination.", score: 40, type: 'warning' as const },
      { text: "Pause deployment, audit the training data for gender bias, retrain with balanced data, and implement ongoing bias monitoring before launch.", feedback: "Ethical & Responsible. Addresses root cause, ensures fairness before deployment, and establishes ongoing monitoring — the gold standard for responsible AI deployment.", score: 100, type: 'success' as const },
    ],
  },
];

export default function Module3({ onComplete }: { onComplete: (score: number) => void }) {
  const [step, setStep] = useState<Step>('learn');
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<(number | null)[]>(new Array(scenarios.length).fill(null));
  const [scenarioSubmitted, setScenarioSubmitted] = useState<boolean[]>(new Array(scenarios.length).fill(false));
  const { addToast } = useToast();

  const stepLabels = [
    { key: 'learn', label: 'Learn', icon: BookOpen },
    { key: 'scenarios', label: 'Scenarios', icon: ShieldAlert },
    { key: 'results', label: 'Results', icon: CheckCircle },
  ];
  const currentIndex = stepLabels.findIndex(s => s.key === step);

  const totalScore = selectedChoices.reduce<number>((sum, choice, i) => {
    if (choice !== null) return sum + scenarios[i].choices[choice].score;
    return sum;
  }, 0);
  const avgScore = Math.round(totalScore / scenarios.length);

  const handleChoiceSubmit = () => {
    const newSubmitted = [...scenarioSubmitted];
    newSubmitted[currentScenario] = true;
    setScenarioSubmitted(newSubmitted);

    const choice = selectedChoices[currentScenario];
    if (choice !== null) {
      const type = scenarios[currentScenario].choices[choice].type;
      if (type === 'success') addToast('Excellent ethical reasoning! ✨', 'success');
      else if (type === 'warning') addToast('Partially correct — review the feedback', 'warning');
      else addToast('This approach has serious ethical concerns', 'error');
    }
  };

  const handleNext = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(currentScenario + 1);
    } else {
      setStep('results');
    }
  };

  const principles = [
    { title: 'Transparency', desc: 'AI systems should be open about their nature and limitations', icon: '🔍' },
    { title: 'Privacy', desc: 'Protect user data and require informed consent for data collection', icon: '🔒' },
    { title: 'Fairness', desc: 'Ensure AI does not discriminate or perpetuate systemic biases', icon: '⚖️' },
    { title: 'Autonomy', desc: 'Respect users\' right to choose and provide opt-out alternatives', icon: '🙋' },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {stepLabels.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`step-dot ${i < currentIndex ? 'completed' : i === currentIndex ? 'active' : 'pending'}`}>
              {i < currentIndex ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            <span className={`text-xs font-bold ml-2 mr-4 hidden sm:block ${i === currentIndex ? '' : 'opacity-50'}`} style={{ color: 'var(--text-primary)' }}>{s.label}</span>
            {i < stepLabels.length - 1 && <div className="step-line w-12 mx-2" style={{ background: i < currentIndex ? 'var(--success)' : 'var(--border-color)' }} />}
          </div>
        ))}
      </div>

      {/* LEARN STEP */}
      {step === 'learn' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card-static rounded-3xl p-8">
            <h2 className="text-2xl font-extrabold font-heading mb-2" style={{ color: 'var(--text-primary)' }}>AI for Social Good</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Deploying AI responsibly requires balancing innovation with ethics. Before tackling the scenarios, review these four guiding principles.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {principles.map((p, i) => (
              <div key={i} className="card-static rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold font-heading text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.desc}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setStep('scenarios')} className="btn-primary w-full !py-4 flex items-center justify-center text-lg">
            Begin Scenarios ({scenarios.length} challenges) <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      )}

      {/* SCENARIOS STEP */}
      {step === 'scenarios' && (
        <div className="space-y-6 animate-fade-in-up" key={currentScenario}>
          {/* Scenario counter */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Scenario {currentScenario + 1} of {scenarios.length}
            </span>
            <div className="flex gap-1.5">
              {scenarios.map((_, i) => (
                <div key={i} className="w-8 h-1.5 rounded-full transition-all" style={{
                  background: i < currentScenario ? 'var(--success)' : i === currentScenario ? 'var(--accent)' : 'var(--border-color)',
                }} />
              ))}
            </div>
          </div>

          <div className="card-static rounded-3xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                <ShieldAlert className="h-3.5 w-3.5 inline mr-1" />Interactive Scenario
              </div>
            </div>

            <h2 className="text-xl font-extrabold font-heading mb-3" style={{ color: 'var(--text-primary)' }}>
              {scenarios[currentScenario].title}
            </h2>
            <p className="p-5 rounded-2xl leading-relaxed mb-6" style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              {scenarios[currentScenario].description}
            </p>

            <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>What is the most ethical approach?</h3>
            <div className="space-y-3">
              {scenarios[currentScenario].choices.map((choice, j) => (
                <div key={j} onClick={() => !scenarioSubmitted[currentScenario] && setSelectedChoices(prev => { const n = [...prev]; n[currentScenario] = j; return n; })}
                  className={`p-4 rounded-2xl cursor-pointer transition-all ${scenarioSubmitted[currentScenario] && selectedChoices[currentScenario] !== j ? 'opacity-40' : ''}`}
                  style={{
                    border: selectedChoices[currentScenario] === j
                      ? scenarioSubmitted[currentScenario]
                        ? `2px solid var(--${choice.type === 'success' ? 'success' : choice.type === 'warning' ? 'warning' : 'danger'})`
                        : '2px solid var(--accent)'
                      : '2px solid var(--border-color)',
                    background: selectedChoices[currentScenario] === j
                      ? scenarioSubmitted[currentScenario]
                        ? `var(--${choice.type === 'success' ? 'success' : choice.type === 'warning' ? 'warning' : 'danger'}-bg)`
                        : 'var(--accent-bg)'
                      : 'transparent',
                  }}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${selectedChoices[currentScenario] === j ? 'border-current' : ''}`}
                      style={{ borderColor: selectedChoices[currentScenario] === j ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {selectedChoices[currentScenario] === j && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{choice.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback panel */}
            {scenarioSubmitted[currentScenario] && selectedChoices[currentScenario] !== null && (
              <div className="mt-6 p-5 rounded-2xl animate-fade-in-up" style={{
                background: `var(--${scenarios[currentScenario].choices[selectedChoices[currentScenario]!].type === 'success' ? 'success' : scenarios[currentScenario].choices[selectedChoices[currentScenario]!].type === 'warning' ? 'warning' : 'danger'}-bg)`,
                border: `1px solid var(--${scenarios[currentScenario].choices[selectedChoices[currentScenario]!].type === 'success' ? 'success' : scenarios[currentScenario].choices[selectedChoices[currentScenario]!].type === 'warning' ? 'warning' : 'danger'})20`,
              }}>
                <h4 className="font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                  {scenarios[currentScenario].choices[selectedChoices[currentScenario]!].type === 'success'
                    ? <CheckCircle className="h-5 w-5" style={{ color: 'var(--success)' }} />
                    : <AlertTriangle className="h-5 w-5" style={{ color: 'var(--danger)' }} />}
                  Outcome Feedback
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {scenarios[currentScenario].choices[selectedChoices[currentScenario]!].feedback}
                </p>
              </div>
            )}

            {/* Action button */}
            {!scenarioSubmitted[currentScenario] ? (
              <button disabled={selectedChoices[currentScenario] === null} onClick={handleChoiceSubmit} className="btn-primary w-full !py-3.5 mt-6">
                Submit Decision
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary w-full !py-3.5 mt-6 flex items-center justify-center">
                {currentScenario < scenarios.length - 1 ? (
                  <>Next Scenario <ArrowRight className="ml-2 h-4 w-4" /></>
                ) : (
                  <>View Final Results</>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULTS STEP */}
      {step === 'results' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card-static rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">{avgScore >= 70 ? '🌟' : avgScore >= 40 ? '🤔' : '📚'}</div>
            <h2 className="text-3xl font-extrabold font-heading" style={{ color: 'var(--text-primary)' }}>
              {avgScore >= 70 ? 'Outstanding Ethics!' : avgScore >= 40 ? 'Room to Grow' : 'Study the Principles'}
            </h2>
            <p className="text-5xl font-black mt-4 font-heading" style={{ color: avgScore >= 70 ? 'var(--success)' : 'var(--warning)' }}>
              {avgScore}%
            </p>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Average score across {scenarios.length} scenarios</p>
          </div>

          <div className="card-static rounded-3xl p-6">
            <h3 className="font-bold mb-4 font-heading" style={{ color: 'var(--text-primary)' }}>Scenario Breakdown</h3>
            <div className="space-y-3">
              {scenarios.map((s, i) => {
                const choice = selectedChoices[i];
                const scoreVal = choice !== null ? s.choices[choice].score : 0;
                return (
                  <div key={i} className="p-4 rounded-xl flex items-center gap-3" style={{
                    background: scoreVal >= 70 ? 'var(--success-bg)' : scoreVal >= 40 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                  }}>
                    {scoreVal >= 70 ? <CheckCircle className="h-5 w-5 shrink-0" style={{ color: 'var(--success)' }} /> : <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: scoreVal >= 40 ? 'var(--warning)' : 'var(--danger)' }} />}
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Score: {scoreVal}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => onComplete(avgScore)} className="btn-primary w-full !py-4 text-lg">
            Complete Module & Earn XP ⚡
          </button>
        </div>
      )}
    </div>
  );
}
