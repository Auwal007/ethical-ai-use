'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, BookOpen, HelpCircle, Search, ArrowRight, FileWarning, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

type Step = 'learn' | 'practice' | 'results';

export default function Module2({ onComplete }: { onComplete: (score: number) => void }) {
  const [step, setStep] = useState<Step>('learn');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();

  const concepts = [
    { icon: FileWarning, title: 'Fake Citations', color: 'from-red-500 to-pink-500', content: 'AI models can fabricate academic references that look convincing but don\'t exist. Always verify citations by checking the journal, author, and DOI. If you can\'t find the paper in Google Scholar or the publisher\'s site, it\'s likely hallucinated.' },
    { icon: BarChart3, title: 'Statistical Errors', color: 'from-amber-500 to-orange-500', content: 'AI can produce statistics that sound precise but are entirely made up (e.g., "87.3% of doctors agree..."). Watch for suspiciously precise numbers, absolute claims ("100% accuracy"), and statistics without credible sources.' },
    { icon: AlertCircle, title: 'Biased Statements', color: 'from-purple-500 to-indigo-500', content: 'AI can perpetuate stereotypes from its training data. Look for sweeping generalizations about groups, claims that one demographic is inherently superior, or conclusions that reinforce historical prejudices rather than challenge them.' },
  ];

  const textBlocks = [
    { text: "Artificial intelligence has transformed modern medicine.", isError: false, feedback: "" },
    { text: "According to a 2024 study by Dr. John Smith published in the 'Fake Journal of Nonexistent AI', AI can now cure all diseases with 100% accuracy.", isError: true, feedback: "Fake Citation & Absolute Claim — The journal does not exist, the author is fabricated, and '100% accuracy' is an impossible absolute claim. Always verify sources." },
    { text: "Many hospitals use machine learning to predict patient admission rates.", isError: false, feedback: "" },
    { text: "Furthermore, algorithms have proven that male doctors are universally more capable of making critical surgical decisions than female doctors.", isError: true, feedback: "Biased Statement — This is a severe case of algorithmic bias reflecting flawed historical datasets, not an objective truth. No credible research supports this claim." },
    { text: "It is important to continuously monitor these systems for fairness.", isError: false, feedback: "" },
  ];

  const handleToggle = (index: number) => {
    if (submitted) return;
    setSelectedIndices(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const correctCount = textBlocks.filter(b => b.isError).length;
  const correctlyIdentified = selectedIndices.filter(i => textBlocks[i].isError).length;
  const falsePositives = selectedIndices.filter(i => !textBlocks[i].isError).length;
  const finalScore = Math.max(0, Math.round(((correctlyIdentified - falsePositives * 0.5) / correctCount) * 100));

  const handleSubmit = () => {
    setSubmitted(true);
    setStep('results');
    if (correctlyIdentified === correctCount && falsePositives === 0) {
      addToast('Perfect! You identified all issues! 🎯', 'success');
    } else {
      addToast(`You identified ${correctlyIdentified} of ${correctCount} issues`, 'info');
    }
  };

  const stepLabels = [
    { key: 'learn', label: 'Learn', icon: BookOpen },
    { key: 'practice', label: 'Practice', icon: Search },
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
            <h2 className="text-2xl font-extrabold font-heading mb-2" style={{ color: 'var(--text-primary)' }}>Critical Evaluation of AI Content</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              AI-generated text can contain errors that are hard to spot. Learn to identify three common types of problems before testing your skills.
            </p>
          </div>

          <div className="space-y-4">
            {concepts.map((c, i) => (
              <div key={i} className="card-static rounded-3xl p-6 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md shrink-0`}>
                    <c.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold font-heading mb-1" style={{ color: 'var(--text-primary)' }}>{c.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep('practice')} className="btn-primary w-full !py-4 flex items-center justify-center text-lg">
            Start Practice Exercise <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      )}

      {/* PRACTICE STEP */}
      {step === 'practice' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card-static rounded-3xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                Interactive Exercise
              </div>
            </div>
            <h2 className="text-2xl font-extrabold font-heading mb-2" style={{ color: 'var(--text-primary)' }}>Spot the Problems</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Read the AI-generated paragraph below. <strong>Click on sentences</strong> you believe contain biased statements or fake citations. Then submit your analysis.
            </p>

            <div className="mt-6 p-6 rounded-2xl text-lg leading-relaxed" style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
              {textBlocks.map((block, i) => (
                <span
                  key={i}
                  onClick={() => handleToggle(i)}
                  className="cursor-pointer transition-all duration-200 rounded px-0.5"
                  style={{
                    background: selectedIndices.includes(i) ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                    borderBottom: selectedIndices.includes(i) ? '2px solid #f59e0b' : '2px solid transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  {block.text}{" "}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {selectedIndices.length} sentence{selectedIndices.length !== 1 ? 's' : ''} selected
              </p>
              <button onClick={handleSubmit} disabled={selectedIndices.length === 0} className="btn-primary flex items-center">
                Analyze Selection <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS STEP */}
      {step === 'results' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card-static rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">{finalScore >= 50 ? '🎯' : '🔍'}</div>
            <h2 className="text-3xl font-extrabold font-heading" style={{ color: 'var(--text-primary)' }}>Analysis Complete</h2>
            <p className="text-5xl font-black mt-4 font-heading" style={{ color: finalScore >= 50 ? 'var(--success)' : 'var(--warning)' }}>
              {finalScore}%
            </p>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              You identified {correctlyIdentified} out of {correctCount} problematic sentences.
              {falsePositives > 0 && ` (${falsePositives} false positive${falsePositives > 1 ? 's' : ''})`}
            </p>
          </div>

          {/* Detailed feedback */}
          <div className="card-static rounded-3xl p-6">
            <h3 className="font-bold mb-4 font-heading" style={{ color: 'var(--text-primary)' }}>Detailed Analysis</h3>
            <div className="space-y-3">
              {textBlocks.map((block, i) => (
                block.isError && (
                  <div key={i} className="p-4 rounded-xl" style={{
                    background: selectedIndices.includes(i) ? 'var(--success-bg)' : 'var(--danger-bg)',
                    border: `1px solid ${selectedIndices.includes(i) ? 'var(--success)' : 'var(--danger)'}20`,
                  }}>
                    <div className="flex items-start gap-3">
                      {selectedIndices.includes(i)
                        ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                        : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />}
                      <div>
                        <p className="text-sm font-semibold italic" style={{ color: 'var(--text-primary)' }}>"{block.text}"</p>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{block.feedback}</p>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          <button onClick={() => onComplete(finalScore)} className="btn-primary w-full !py-4 text-lg">
            Complete Module & Earn XP ⚡
          </button>
        </div>
      )}
    </div>
  );
}
