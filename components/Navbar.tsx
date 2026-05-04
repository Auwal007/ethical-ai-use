'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useTheme } from './ui/ThemeProvider';
import { LogOut, Shield, Sun, Moon, Menu, X, Zap, Flame } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav
        className="h-16 px-4 sm:px-8 flex items-center justify-between shrink-0 w-full sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: 'var(--nav-bg)',
          borderBottom: '1px solid var(--nav-border)',
        }}
      >
        <div className="flex items-center space-x-3">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block font-heading" style={{ color: 'var(--text-primary)' }}>
              ATBU <span className="font-normal" style={{ color: 'var(--text-muted)' }}>| AI Literacy</span>
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-4">
          {user && (
            <>
              {/* Streak badge */}
              {user.streak > 0 && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                  <Flame className="h-3.5 w-3.5" />
                  <span>{user.streak} day streak</span>
                </div>
              )}
              {/* XP badge */}
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                <Zap className="h-3.5 w-3.5" />
                <span>{user.xp || 0} XP</span>
              </div>
            </>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          {user ? (
            <div className="flex items-center space-x-4 pl-4" style={{ borderLeft: '1px solid var(--border-color)' }}>
              {user.role === 'admin' && (
                <Link href="/admin" className="flex items-center space-x-1 text-sm font-bold transition" style={{ color: 'var(--text-secondary)' }}>
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <div className="text-right">
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{user.level?.name || user.role}</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '2px solid var(--accent-glow)' }}
              >
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <button onClick={logout} className="transition-colors hover:text-red-500" style={{ color: 'var(--text-muted)' }} title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/login" className="text-sm font-bold transition hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>Log in</Link>
              <Link href="/register" className="btn-primary text-sm !py-2 !px-5">Get Started</Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-x-0 top-16 z-40 p-4 animate-slide-down"
          style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}
        >
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.level?.name} • {user.xp || 0} XP</p>
                </div>
              </div>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block p-3 rounded-xl font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="block p-3 rounded-xl font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  Admin Panel
                </Link>
              )}
              <button onClick={logout} className="w-full text-left p-3 rounded-xl font-medium text-sm text-red-500">
                Log Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block p-3 rounded-xl font-medium text-sm text-center" style={{ color: 'var(--text-primary)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                Log In
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block btn-primary text-sm text-center">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
