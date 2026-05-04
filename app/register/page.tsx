'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { addToast } = useToast();

  // Password strength
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'][strength];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        addToast('Account created! Welcome aboard 🎉', 'success');
        await refreshUser();
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute w-96 h-96 rounded-full top-1/4 -left-48 opacity-20 animate-float-slow" style={{ background: 'var(--accent)', filter: 'blur(100px)' }} />
        <div className="absolute w-96 h-96 rounded-full bottom-1/4 -right-48 opacity-15 animate-float-slow" style={{ background: '#a855f7', filter: 'blur(100px)', animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="card-static rounded-3xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-5 shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading" style={{ color: 'var(--text-primary)' }}>Create Account</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Sign up to start your ethical AI journey</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl text-sm font-medium animate-fade-in" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="input-field !pl-11" required placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field !pl-11" required placeholder="student@atbu.edu.ng"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field !pl-11 !pr-11" required placeholder="••••••••" minLength={6}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-3 animate-fade-in">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300" style={{ background: i <= strength ? strengthColor : 'var(--border-color)' }} />
                    ))}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--accent)' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
