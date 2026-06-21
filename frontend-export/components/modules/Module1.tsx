'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, ArrowRight, BookOpen, HelpCircle, Shield, Eye, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

type Step = 'learn' | 'quiz' | 'results';

export default function Module1({ onComplete }: { onComplete: (score: number) => void }) {
  const [step, setStep] = useState<Step>('learn');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const { addToast } = useToast();

  const concepts = [
    { icon: Shield, title: 'Data Privacy', color: 'from-blue-500 to-cyan-500', content: 'When you interact with AI tools, your prompts and data may be stored and used to train future models. Understanding data privacy means knowing what data you share, how it is stored, and who has access to it. Always be cautious about sharing sensitive personal or academic information with AI systems.' },
    { icon: Brain, title: 'Algorithmic Bias', color: 'from-purple-500 to-indigo-500', content: 'AI systems learn from data created by humans — and that data often contains biases. Algorithmic bias occurs when an AI system produces results that are systematically prejudiced due to flawed assumptions or imbalanced training data. This can lead to unfair outcomes in areas like hiring, healthcare, and education.' },
    { icon: Eye, title: 'AI Hallucinations', color: 'from-amber-500 to-orange-500', content: 'AI "hallucination" refers to instances where an AI model confidently generates information that is factually incorrect, fabricated, or nonsensical. This includes fake citations, invented statistics, and plausible-sounding but entirely false claims. Always verify AI-generated information.' },
    { icon: BookOpen, title: 'Ethical AI Use in Academia', color: 'from-emerald-500 to-green-500', content: 'Using AI ethically in university means being transparent about AI assistance, not submitting AI-generated work as your own, using AI as a learning aid rather than a replacement for critical thinking, and understanding your institution\'s policies on AI usage.' },
  ];

  const questions = [
    { q: "What is Algorithmic Bias?", opts: ["A bug in the code that crashes an AI", "When an AI system reflects human biases found in its training data", "A new type of AI reasoning"], ans: "When an AI system reflects human biases found in its training data" },
    { q: "Why is Data Privacy important in AI?", opts: ["To make AI run faster", "It protects personal information from being exploited or misused", "To save cloud storage space"], ans: "It protects personal information from being exploited or misused" },
    { q: "Which of the following is an example of unethical AI use in universities?", opts: ["Using AI to generate ideas for a brainstorming session", "Submitting an entirely AI-generated essay as your own work", "Using AI to summarize research papers quickly"], ans: "Submitting an entirely AI-generated essay as your own work" },
    { q: "What does AI 'Hallucination' refer to?", opts: ["When an AI visualizes images instead of text", "When an AI confidently provides incorrect or nonsensical information", "When an AI becomes self-aware"], ans: "When an AI confidently provides incorrect or nonsensical information" },
    { q: "How can students mitigate algorithmic bias?", opts: ["By critically evaluating AI outputs and cross-referencing with other sources", "By trusting the AI unconditionally", "By stopping the use of AI tools entirely"], ans: "By critically evaluating AI outputs and cross-referencing with other sources" },
  ];

  const handleSubmit = () => {
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.ans) s++; });
    setScore(s);
    setSubmitted(true);
    setStep('results');
    if (s >= 3) addToast(`Great work! You scored ${s}/5 🎉`, 'success');
    else addToast(`You scored ${s}/5. Try again!`, 'warning');
  };

  const stepLabels = [
    { key: 'learn', label: 'Learn', icon: BookOpen },
    { key: 'quiz', label: 'Quiz', icon: HelpCircle },
    { key: 'results', label: 'Results', icon: CheckCircle },
  ];
  const currentIndex = stepLabels.findIndex(s => s.key === step);

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
            <h2 className="text-2xl font-extrabold font-heading mb-2" style={{ color: 'var(--text-primary)' }}>Understanding AI Ethics</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Artificial Intelligence tools are powerful, but they are not infallible. Before taking the quiz, study the four key concepts below.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {concepts.map((c, i) => (
              <ConceptCard key={i} concept={c} delay={i * 0.1} />
            ))}
          </div>

          <button onClick={() => setStep('quiz')} className="btn-primary w-full !py-4 flex items-center justify-center text-lg">
            I&apos;m Ready for the Quiz <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      )}

      {/* QUIZ STEP */}
      {step === 'quiz' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card-static rounded-3xl p-8">
            <h2 className="text-2xl font-extrabold font-heading mb-2" style={{ color: 'var(--text-primary)' }}>Knowledge Check</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Answer all 5 questions. You need at least 3 correct to pass.</p>
          </div>

          <div className="card-static rounded-3xl p-8">
            {questions.map((q, i) => (
              <div key={i} className="mb-6 pb-6 last:mb-0 last:pb-0" style={{ borderBottom: i < questions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <p className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{i + 1}. {q.q}</p>
                <div className="space-y-2">
                  {q.opts.map((opt, j) => (
                    <label key={j} className="flex items-center p-3 rounded-xl cursor-pointer transition-all" style={{
                      background: answers[i] === opt ? 'var(--accent-bg)' : 'transparent',
                      border: answers[i] === opt ? '1.5px solid var(--accent)' : '1.5px solid var(--border-color)',
                    }}>
                      <input type="radio" name={`q-${i}`} className="mr-3 accent-indigo-600" onChange={() => setAnswers({ ...answers, [i]: opt })} checked={answers[i] === opt} />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length} className="btn-primary w-full !py-3.5 mt-4">
              Submit Quiz
            </button>
          </div>
        </div>
      )}

      {/* RESULTS STEP */}
      {step === 'results' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card-static rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">{score >= 3 ? '🎉' : '📚'}</div>
            <h2 className="text-3xl font-extrabold font-heading" style={{ color: 'var(--text-primary)' }}>
              {score >= 3 ? 'Excellent Work!' : 'Keep Learning!'}
            </h2>
            <p className="text-5xl font-black mt-4 font-heading" style={{ color: score >= 3 ? 'var(--success)' : 'var(--danger)' }}>
              {score} / 5
            </p>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              {score >= 3 ? 'You passed! You can proceed to the next module.' : 'You need at least 3 correct answers. Review the material and try again.'}
            </p>
          </div>

          {/* Per-question breakdown */}
          <div className="card-static rounded-3xl p-6">
            <h3 className="font-bold mb-4 font-heading" style={{ color: 'var(--text-primary)' }}>Question Breakdown</h3>
            <div className="space-y-3">
              {questions.map((q, i) => {
                const correct = answers[i] === q.ans;
                return (
                  <div key={i} className="p-3 rounded-xl flex items-start gap-3" style={{ background: correct ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
                    {correct ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} /> : <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{q.q}</p>
                      {!correct && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Correct: {q.ans}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {score >= 3 ? (
            <button onClick={() => onComplete(score)} className="btn-primary w-full !py-4 text-lg">
              Complete Module & Earn XP ⚡
            </button>
          ) : (
            <button onClick={() => { setStep('learn'); setSubmitted(false); setAnswers({}); }} className="btn-secondary w-full !py-4">
              Review Material & Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ConceptCard({ concept, delay }: { concept: any; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card rounded-3xl p-6 cursor-pointer animate-fade-in-up" style={{ animationDelay: `${delay}s` }} onClick={() => setExpanded(!expanded)}>
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${concept.color} flex items-center justify-center mb-4 shadow-md`}>
        <concept.icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-bold font-heading mb-2" style={{ color: 'var(--text-primary)' }}>{concept.title}</h3>
      <p className={`text-sm leading-relaxed transition-all ${expanded ? '' : 'line-clamp-3'}`} style={{ color: 'var(--text-secondary)' }}>
        {concept.content}
      </p>
      <button className="text-xs font-bold mt-2" style={{ color: 'var(--accent)' }}>{expanded ? 'Show less' : 'Read more →'}</button>
    </div>
  );
}
