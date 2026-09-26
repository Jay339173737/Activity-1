const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "..", "habits.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  timezone      TEXT DEFAULT 'UTC',
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  schedule_type TEXT DEFAULT 'daily',        -- daily | weekdays | custom
  schedule_days TEXT DEFAULT '[]',           -- e.g. ["mon","wed"] for custom
  color         TEXT DEFAULT '#4F46E5',
  reminder_time TEXT,                        -- "HH:MM" or null
  target_per_day INTEGER DEFAULT 1,
  archived      INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS completions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id     INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,                -- YYYY-MM-DD in the USER'S local timezone
  completed_at TEXT DEFAULT (datetime('now')),
  note         TEXT DEFAULT '',
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_completions_user_date ON completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
`);

module.exports = db;
