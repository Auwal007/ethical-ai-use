'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useTheme } from './ui/ThemeProvider';
import { LogOut, Shield, Sun, Moon, Menu, X, Zap, Flame } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();

  if (!mounted) {
    return (
      <button
        className="w-9 h-9 rounded flex items-center justify-center transition-all"
        style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded flex items-center justify-center transition-all hover:-translate-y-0.5"
      style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} /> : <Sun className="h-4 w-4" style={{ color: 'var(--gold)' }} />}
    </button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav
        className="h-20 px-6 lg:px-12 flex items-center justify-between shrink-0 w-full sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: 'var(--nav-bg)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <Image src="/ATBU%20LOGO.png" alt="ATBU Logo" width={42} height={42} className="object-contain" />
          <div className="text-base font-medium tracking-[0.03em] hidden sm:block">
            <span className="font-bold" style={{ color: 'var(--green)' }}>ATBU</span>
            <span className="mx-1" style={{ color: 'var(--brown)', opacity: 0.6 }}>|</span>
            <span style={{ color: 'var(--text-primary)' }}>AI Literacy</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          {!user ? (
            <>
              <div className="flex items-center gap-10">
                <Link href="/#modules" className="text-sm font-medium transition-colors hover:text-green-800" style={{ color: 'var(--brown)' }}>Learning Modules</Link>
                <Link href="/#features" className="text-sm font-medium transition-colors hover:text-green-800" style={{ color: 'var(--brown)' }}>Platform Features</Link>
              </div>
              <div className="flex items-center gap-4 pl-10 border-l" style={{ borderColor: 'var(--border-color)' }}>
                <ThemeToggle />
                <Link href="/login" className="btn-primary !py-2.5 !px-6 text-sm shadow-sm hover:shadow-md">
                  Login &rarr;
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              {/* Streak badge */}
              {(user.streak ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', borderColor: 'rgba(184,150,12,0.3)' }}>
                  <Flame className="h-3.5 w-3.5" />
                  <span>{user.streak} day streak</span>
                </div>
              )}
              {/* XP badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'rgba(26,92,42,0.3)' }}>
                <Zap className="h-3.5 w-3.5" />
                <span>{user.xp ?? 0} XP</span>
              </div>

              <ThemeToggle />

              <div className="flex items-center gap-4 pl-4 border-l" style={{ borderColor: 'var(--border-color)' }}>
                {user.role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-1.5 text-sm font-bold transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="text-right">
                  <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{user.level?.name || user.role}</p>
                </div>
                <div
                  className="w-10 h-10 rounded flex items-center justify-center font-bold text-sm shadow-sm"
                  style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1.5px solid var(--success)' }}
                >
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <button onClick={logout} className="transition-colors hover:text-red-500" style={{ color: 'var(--text-muted)' }} title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded flex items-center justify-center"
            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-x-0 top-20 z-40 p-5 shadow-lg animate-slide-down"
          style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}
        >
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-sm" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.level?.name} • {user.xp ?? 0} XP</p>
                </div>
              </div>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block p-3 rounded font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="block p-3 rounded font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  Admin Panel
                </Link>
              )}
              <button onClick={logout} className="w-full text-left p-3 rounded font-medium text-sm text-red-500">
                Log Out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Link href="/#modules" onClick={() => setMobileOpen(false)} className="block p-3 font-medium text-sm hover:bg-gray-50" style={{ color: 'var(--text-primary)' }}>Learning Modules</Link>
              <Link href="/#features" onClick={() => setMobileOpen(false)} className="block p-3 font-medium text-sm hover:bg-gray-50" style={{ color: 'var(--text-primary)' }}>Platform Features</Link>
              
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block btn-primary text-sm text-center w-full !py-3">
                Login
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
