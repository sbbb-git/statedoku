-- Statedoku — D1 schema for game analytics
-- Run with: wrangler d1 execute statedoku-stats --remote --file=bot/d1-schema.sql

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK(event_type IN ('puzzle_start','puzzle_solve','puzzle_lost')),
  puzzle_date TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  country TEXT,
  lang TEXT,
  time_seconds INTEGER,
  mistakes INTEGER
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp);
