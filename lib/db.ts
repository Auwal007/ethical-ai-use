import Database from 'better-sqlite3';
import path from 'path';

// For MVP, we use a local SQLite database file in the project root.
const dbPath = path.join(process.cwd(), 'mvp.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    last_active_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    score INTEGER,
    status TEXT NOT NULL, -- 'in_progress', 'completed'
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(module_id) REFERENCES modules(id),
    UNIQUE(user_id, module_id)
  );
`);

// Safely add new columns to existing databases (won't error if already exists)
const addColumnSafe = (table: string, column: string, type: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch {
    // Column already exists, ignore
  }
};

addColumnSafe('users', 'xp', 'INTEGER DEFAULT 0');
addColumnSafe('users', 'current_streak', 'INTEGER DEFAULT 0');
addColumnSafe('users', 'last_active_date', 'TEXT');
addColumnSafe('users', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

// Seed initial modules if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM modules');
const countResult = countStmt.get() as { count: number };

if (countResult.count === 0) {
  const insertModule = db.prepare('INSERT INTO modules (title, description) VALUES (?, ?)');
  insertModule.run(
    'AI Ethical Awareness', 
    'Learn about data privacy, algorithmic bias, and the ethical implications of using AI.'
  );
  insertModule.run(
    'Critical Evaluation', 
    'Learn how to evaluate AI-generated content for biased statements and fake citations.'
  );
  insertModule.run(
    'AI for Social Good', 
    'A scenario-based interaction exploring how AI can be deployed responsibly.'
  );
}

export default db;
