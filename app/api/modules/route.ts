import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    const modules = db.prepare('SELECT id, title, description FROM modules').all() as any[];

    if (session && session.userId) {
      // Include progress for logged in users
      const progress = db.prepare('SELECT module_id, status, score FROM progress WHERE user_id = ?').all(session.userId) as any[];
      const progressMap = progress.reduce((acc, p) => ({ ...acc, [p.module_id]: p }), {});
      
      const modulesWithProgress = modules.map(m => ({
        ...m,
        progress: progressMap[m.id] || { status: 'pending', score: null }
      }));
      return NextResponse.json(modulesWithProgress);
    }

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Modules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
