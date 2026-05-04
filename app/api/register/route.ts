import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const checkUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (checkUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email.endsWith('@admin.atbu.edu.ng') ? 'admin' : 'student';

    const insertStmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = insertStmt.run(name, email, hashedPassword, role);
    const userId = Number(result.lastInsertRowid);

    await createSession(userId, role);

    return NextResponse.json({ 
      message: 'Registration successful',
      user: { id: userId, name, email, role }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
