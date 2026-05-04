'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { BookOpen, LogOut, LayoutDashboard, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-sm w-full mx-auto">
        <div className="flex items-center space-x-3">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">A</div>
            <span className="text-xl font-bold tracking-tight text-indigo-900 hidden sm:block">ATBU <span className="font-normal text-slate-500">| AI Literacy</span></span>
          </Link>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6">
          {user && (
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">System Active</span>
            </div>
          )}
          {user ? (
            <div className="flex items-center space-x-4 sm:border-l sm:border-slate-200 sm:pl-6">
              {user.role === 'admin' && (
                <Link href="/admin" className="text-slate-600 hover:text-indigo-600 hidden md:flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-bold">Admin</span>
                </Link>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter text-ellipsis overflow-hidden whitespace-nowrap max-w-[100px]">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-700">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="text-slate-500 hover:text-red-500 transition-colors ml-2"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-slate-600 hover:text-indigo-600 font-bold text-sm">Log in</Link>
              <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm text-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
    </nav>
  );
}
