'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      await refreshUser();
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
        <p className="text-slate-500 mt-2">Enter your details to access your dashboard</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            required
            placeholder="student@atbu.edu.ng"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-900 transition-colors shadow-sm">
          Log In
        </button>
      </form>

      <p className="text-center mt-6 text-slate-600">
        Don't have an account? <Link href="/register" className="text-indigo-600 font-bold hover:underline">Register</Link>
      </p>
    </div>
  );
}
