import Link from 'next/link';
import { ArrowRight, BrainCircuit, CheckCircle, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          Ethical AI Literacy System
          <span className="block text-indigo-600 mt-2">for University Students</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          The ATBU interactive platform designed to teach you how to use AI tools ethically, critically, and securely in your academic journey.
        </p>
        <div className="flex items-center justify-center space-x-4 pt-6">
          <Link href="/register" className="inline-flex items-center px-8 py-3 rounded-2xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-900 transition shadow-lg">
            Start Learning <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link href="/login" className="inline-flex items-center px-8 py-3 rounded-2xl bg-white text-slate-900 border border-slate-200 font-bold text-lg hover:bg-slate-50 transition shadow-sm">
            Log In
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl mt-16 text-left">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-start transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Algorithmic Bias</h3>
          <p className="text-slate-600">Understand how AI systems can inherit human biases and how to critically evaluate their outputs.</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-start transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Critical Evaluation</h3>
          <p className="text-slate-600">Learn to spot fake citations, AI hallucinations, and verify statistical claims.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-start transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Social Good</h3>
          <p className="text-slate-600">Explore scenarios where AI can be used to solve challenges while protecting user privacy.</p>
        </div>
      </div>
    </div>
  );
}
