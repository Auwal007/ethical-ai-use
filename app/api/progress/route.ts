import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module_id, score, status } = await req.json();

    if (!module_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already completed (don't allow re-completion to farm XP)
    const existing = db.prepare('SELECT status, score FROM progress WHERE user_id = ? AND module_id = ?').get(session.userId, module_id) as any;
    const alreadyCompleted = existing?.status === 'completed';

    const upsertStmt = db.prepare(`
      INSERT INTO progress (user_id, module_id, score, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, module_id) DO UPDATE SET
        score = excluded.score,
        status = excluded.status,
        completed_at = CURRENT_TIMESTAMP
    `);
    
    upsertStmt.run(session.userId, module_id, score, status);

    // Award XP on first completion
    if (status === 'completed' && !alreadyCompleted) {
      // Normalize scores: Module 1 is out of 5 (multiply by 20), Module 2 & 3 are out of 100
      let xpGain = score;
      if (module_id === 1) {
        xpGain = score * 20; // 5 * 20 = 100 max XP
      }
      xpGain = Math.max(0, Math.min(100, xpGain));
      
      db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpGain, session.userId);
    }

    return NextResponse.json({ message: 'Progress updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Progress API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin route to get all user progress
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allProgress = db.prepare(`
      SELECT 
        users.id as user_id, 
        users.name as user_name,
        users.email as user_email,
        users.xp as user_xp,
        modules.id as module_id,
        modules.title as module_title,
        progress.status,
        progress.score,
        progress.completed_at
      FROM users
      LEFT JOIN progress ON users.id = progress.user_id
      LEFT JOIN modules ON progress.module_id = modules.id
      WHERE users.role = 'student'
      ORDER BY users.id, modules.id
    `).all();

    // Also get summary stats
    const totalStudents = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='student'").get() as any).c;
    const completedModules = (db.prepare("SELECT COUNT(*) as c FROM progress WHERE status='completed'").get() as any).c;
    const avgScore = (db.prepare("SELECT AVG(score) as avg FROM progress WHERE status='completed'").get() as any).avg || 0;

    // Module completion breakdown
    const moduleStats = db.prepare(`
      SELECT 
        m.id,
        m.title,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completions,
        ROUND(AVG(CASE WHEN p.status = 'completed' THEN p.score END), 1) as avg_score
      FROM modules m
      LEFT JOIN progress p ON m.id = p.module_id
      GROUP BY m.id
      ORDER BY m.id
    `).all();

    return NextResponse.json({
      progress: allProgress,
      stats: {
        totalStudents,
        completedModules,
        avgScore: Math.round(avgScore),
        moduleStats,
      }
    });
  } catch (error) {
    console.error('Progress GET API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
