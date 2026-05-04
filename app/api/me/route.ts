import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const user = db.prepare('SELECT id, name, email, role, xp, current_streak, last_active_date FROM users WHERE id = ?').get(session.userId) as any;
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Update streak logic
    const today = new Date().toISOString().split('T')[0];
    if (user.last_active_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = 1;
      if (user.last_active_date === yesterday) {
        newStreak = (user.current_streak || 0) + 1;
      }
      db.prepare('UPDATE users SET current_streak = ?, last_active_date = ? WHERE id = ?').run(newStreak, today, user.id);
      user.current_streak = newStreak;
      user.last_active_date = today;
    }

    // Calculate level from XP
    const xp = user.xp || 0;
    let level = { name: 'Novice', number: 1, nextXp: 50 };
    if (xp >= 250) level = { name: 'AI Guardian', number: 4, nextXp: 300 };
    else if (xp >= 150) level = { name: 'Scholar', number: 3, nextXp: 250 };
    else if (xp >= 50) level = { name: 'Apprentice', number: 2, nextXp: 150 };

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        xp,
        streak: user.current_streak || 0,
        level,
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
