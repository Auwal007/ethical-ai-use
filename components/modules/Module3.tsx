'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Module3({ onComplete }: { onComplete: (score: number) => void }) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const scenario = {
    title: "University Chatbot Deployment",
    description: "You are part of a student council initiative deploying a new AI chatbot to help students navigate campus, handle mental health crises, and provide academic advice. You have a limited budget. How do you configure the mental health feature?",
    choices: [
      {
        id: 0,
        text: "Automate everything. The AI should act as a therapist to save costs, keeping chat logs to learn and improve.",
        feedback: "Highly Unethical. AI should not act as a therapist due to hallucination risks and lack of genuine empathy. Storing sensitive chat logs without explicit consent violates data privacy.",
        score: 0,
        type: 'danger'
      },
      {
        id: 1,
        text: "The AI should detect key terms related to distress and immediately forward the full chat log automatically to to the nearest counselor.",
        feedback: "Partially Ethical. While it protects the student from AI inaccuracies, automatically forwarding private chats without consent still violates privacy.",
        score: 50,
        type: 'warning'
      },
      {
        id: 2,
        text: "The AI should detect distress terms, explicitly state it is an AI, provide immediate emergency hotline numbers, and ask if the user wants to be connected to a human counselor.",
        feedback: "Ethical & Responsible. The AI is transparent about its nature, refrains from giving medical advice, and respects user autonomy and privacy by asking permission before escalating.",
        score: 100,
        type: 'success'
      }
    ]
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
          <ShieldAlert className="h-4 w-4" />
          <span>Interactive Scenario</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">{scenario.title}</h2>
        <p className="text-gray-700 text-lg leading-relaxed bg-gray-50 border p-5 rounded-xl">
          {scenario.description}
        </p>

        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-gray-900">What is the most ethical approach?</h3>
          {scenario.choices.map((choice) => (
            <div 
              key={choice.id}
              onClick={() => !submitted && setSelectedChoice(choice.id)}
              className={`p-4 rounded-xl border-2 transition cursor-pointer relative ${
                submitted 
                  ? choice.id === selectedChoice 
                    ? 'border-gray-400 bg-gray-50' 
                    : 'opacity-40 border-transparent'
                  : selectedChoice === choice.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start pr-8">
                <div className={`mt-0.5 h-4 w-4 rounded-full border flex-shrink-0 mr-3 ${selectedChoice === choice.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'}`}></div>
                <p className="text-gray-800">{choice.text}</p>
              </div>
            </div>
          ))}
        </div>

        {!submitted ? (
          <button 
            disabled={selectedChoice === null}
            onClick={() => setSubmitted(true)}
            className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 w-full"
          >
            Submit Decision
          </button>
        ) : (
          <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
            {selectedChoice !== null && (
              <div className={`p-6 rounded-xl border ${
                scenario.choices[selectedChoice].type === 'success' ? 'bg-green-50 border-green-200' :
                scenario.choices[selectedChoice].type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
              }`}>
                <h4 className="font-bold mb-2 flex items-center">
                  {scenario.choices[selectedChoice].type === 'success' ? <CheckCircle className="h-5 w-5 mr-2 text-green-600" /> : <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />}
                  Outcome Feedback
                </h4>
                <p className="text-gray-800">{scenario.choices[selectedChoice].feedback}</p>
              </div>
            )}
            
            <button 
              onClick={() => onComplete(scenario.choices[selectedChoice!].score)}
              className="mt-6 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition w-full flex justify-center items-center"
            >
              Finish Module
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
  )
}
