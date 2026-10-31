-- Statedoku — D1 schema for game analytics
-- Run with: wrangler d1 execute statedoku-stats --remote --file=bot/d1-schema.sql

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,   -- no CHECK: ALLOWED_EVENTS in functions/api/events.js is the gate
  puzzle_date TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  country TEXT,
  lang TEXT,
  time_seconds INTEGER,
  mistakes INTEGER,
  src TEXT,       -- where the visit came from, a coarse class (functions/api/events.js)
  streak TEXT     -- streak band at the end of a grid
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp);
