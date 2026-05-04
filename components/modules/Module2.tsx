'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function Module2({ onComplete }: { onComplete: (score: number) => void }) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Split text into selectable sentences
  const textBlocks = [
    { text: "Artificial intelligence has transformed modern medicine.", isError: false, feedback: "" },
    { text: "According to a 2024 study by Dr. John Smith published in the 'Fake Journal of Nonexistent AI', AI can now cure all diseases with 100% accuracy.", isError: true, feedback: "Fake Citation & Absolute Claim. AI cannot cure all diseases with 100% accuracy, and the journal does not exist." },
    { text: "Many hospitals use machine learning to predict patient admission rates.", isError: false, feedback: "" },
    { text: "Furthermore, algorithms have proven that male doctors are universally more capable of making critical surgical decisions than female doctors.", isError: true, feedback: "Biased Statement. This is a severe case of algorithmic bias reflecting flawed historical datasets, not an objective truth." },
    { text: "It is important to continuously monitor these systems for fairness.", isError: false, feedback: "" }
  ];

  const handleToggle = (index: number) => {
    if (submitted) return;
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const score = selectedIndices.reduce((acc, idx) => {
    return acc + (textBlocks[idx].isError ? 1 : -0.5); // penalty for wrong ones
  }, 0);
  const correctCount = textBlocks.filter(b => b.isError).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="bg-white p-8 rounded-3xl border border-slate-200">
        <h2 className="text-2xl font-bold mb-2">Critical Evaluation</h2>
        <p className="text-gray-600 mb-6">
          Read the following AI-generated paragraph. Some sentences contain <strong>biased statements</strong> or <strong>fake citations</strong>.
          Click on the sentences you believe are problematic to highlight them.
        </p>

        <div className="p-6 bg-gray-50 border rounded-xl text-lg leading-relaxed shadow-inner">
          {textBlocks.map((block, i) => (
            <span 
              key={i} 
              onClick={() => handleToggle(i)}
              className={`cursor-pointer transition-colors duration-200 pb-1 ${
                selectedIndices.includes(i) 
                  ? 'bg-yellow-200 border-b-2 border-yellow-400' 
                  : 'hover:bg-gray-200 border-b-2 border-transparent'
              } ${submitted && block.isError && !selectedIndices.includes(i) ? 'bg-red-100 border-red-300' : ''}`}
            >
              {block.text}{" "}
            </span>
          ))}
        </div>

        {!submitted ? (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => setSubmitted(true)}
              disabled={selectedIndices.length === 0}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Analyze Text
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold flex items-center text-gray-900 border-b pb-4">
              <AlertCircle className="h-5 w-5 mr-2 text-indigo-500" />
              Analysis Results
            </h3>
            
            <div className="space-y-4">
              {textBlocks.map((block, i) => (
                block.isError && (
                  <div key={i} className={`p-4 rounded-xl border ${selectedIndices.includes(i) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start">
                      {selectedIndices.includes(i) ? <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />}
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1 italic">"{block.text}"</p>
                        <p className="text-sm mt-1 text-gray-700">{block.feedback}</p>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg mt-6">
              <span className="font-medium text-gray-700">You identified {selectedIndices.filter(i => textBlocks[i].isError).length} out of {correctCount} issues.</span>
              <button 
                onClick={() => onComplete(Math.max(0, Math.min(100, Math.round((score / correctCount) * 100))))}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-sm hover:bg-indigo-700"
              >
                Complete Module
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
