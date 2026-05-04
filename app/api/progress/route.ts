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

    const upsertStmt = db.prepare(`
      INSERT INTO progress (user_id, module_id, score, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, module_id) DO UPDATE SET
        score = excluded.score,
        status = excluded.status,
        completed_at = CURRENT_TIMESTAMP
    `);
    
    upsertStmt.run(session.userId, module_id, score, status);

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

    return NextResponse.json(allProgress);
  } catch (error) {
    console.error('Progress GET API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
