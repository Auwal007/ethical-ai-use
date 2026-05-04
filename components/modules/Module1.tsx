'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function Module1({ onComplete }: { onComplete: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      q: "What is Algorithmic Bias?",
      opts: ["A bug in the code that crashes an AI", "When an AI system reflects human biases found in its training data", "A new type of AI reasoning"],
      ans: "When an AI system reflects human biases found in its training data"
    },
    {
      q: "Why is Data Privacy important in AI?",
      opts: ["To make AI run faster", "It protects personal information from being exploited or misused", "To save cloud storage space"],
      ans: "It protects personal information from being exploited or misused"
    },
    {
      q: "Which of the following is an example of unethical AI use in universities?",
      opts: ["Using AI to generate ideas for a brainstorming session", "Submitting an entirely AI-generated essay as your own work", "Using AI to summarize research papers quickly"],
      ans: "Submitting an entirely AI-generated essay as your own work"
    },
    {
      q: "What does AI 'Hallucination' refer to?",
      opts: ["When an AI visualizes images instead of text", "When an AI confidently provides incorrect or nonsensical information", "When an AI becomes self-aware"],
      ans: "When an AI confidently provides incorrect or nonsensical information"
    },
    {
      q: "How can students mitigate algorithmic bias?",
      opts: ["By critically evaluating AI outputs and cross-referencing with other sources", "By trusting the AI unconditionally", "By stopping the use of AI tools entirely"],
      ans: "By critically evaluating AI outputs and cross-referencing with other sources"
    }
  ];

  const handleSubmit = () => {
    let currentScore = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.ans) currentScore++;
    });
    setScore(currentScore);
    setSubmitted(true);
  };

  const handleFinish = () => {
    onComplete(score);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h2 className="text-2xl font-bold mb-4">Understanding AI Ethics</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Artificial Intelligence tools are powerful, but they are not infallible. 
          When using AI, it is crucial to understand concepts like <strong>Data Privacy</strong> (how your prompts might be stored and used to train future datasets) 
          and <strong>Algorithmic Bias</strong> (how the system might favor certain demographics due to imbalanced training data).
        </p>
        
        {/* Placeholder for Video */}
        <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 relative group overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/10 opcaity-0 group-hover:opacity-100 transition"></div>
          <div className="text-center">
            <PlayIcon className="h-12 w-12 text-indigo-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">Video Placeholder: Introduction to AI Ethics</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200">
        <h3 className="text-xl font-bold mb-6">Knowledge Check</h3>
        {questions.map((q, i) => (
          <div key={i} className="mb-6 pb-6 border-b last:border-0 test-left">
            <p className="font-semibold text-gray-800 mb-3">{i + 1}. {q.q}</p>
            <div className="space-y-2">
              {q.opts.map((opt, j) => (
                <label key={j} className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                  submitted 
                    ? opt === q.ans 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : answers[i] === opt 
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'opacity-50'
                    : answers[i] === opt ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name={`q-${i}`}
                    disabled={submitted}
                    className="mr-3 text-indigo-600"
                    onChange={() => setAnswers({ ...answers, [i]: opt })}
                    checked={answers[i] === opt}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        
        {!submitted ? (
          <button 
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold flex items-center justify-center rounded-xl hover:bg-indigo-700 disabled:opacity-50"
          >
            Submit Quiz
          </button>
        ) : (
          <div className="mt-8 p-6 bg-gray-50 border rounded-xl flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">Your Score: {score} / 5</p>
              <p className={`text-sm font-medium ${score >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                {score >= 3 ? 'Passed! Excellent work.' : 'Failed. Please review the material.'}
              </p>
            </div>
            {score >= 3 ? (
               <button onClick={handleFinish} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-sm hover:bg-indigo-700">Complete Module</button>
            ) : (
               <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="px-6 py-2 bg-white border text-gray-700 rounded-lg font-semibold hover:bg-gray-50">Retry Quiz</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
  )
}
