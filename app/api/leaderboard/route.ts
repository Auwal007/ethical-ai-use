import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const leaderboard = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.xp,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as modules_completed,
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.score ELSE 0 END), 0) as total_score
      FROM users u
      LEFT JOIN progress p ON u.id = p.user_id
      WHERE u.role = 'student'
      GROUP BY u.id
      HAVING modules_completed > 0
      ORDER BY u.xp DESC, total_score DESC
      LIMIT 10
    `).all() as any[];

    // Only return first name for privacy
    const sanitized = leaderboard.map((row, index) => ({
      rank: index + 1,
      name: row.name.split(' ')[0],
      xp: row.xp || 0,
      modules_completed: row.modules_completed,
      total_score: row.total_score,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
