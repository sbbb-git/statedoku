-- Statedoku — D1 schema additions for email reminders
-- Run with: wrangler d1 execute statedoku-stats --remote --file=bot/d1-schema-email.sql

CREATE TABLE IF NOT EXISTS email_subscribers (
  email TEXT PRIMARY KEY,
  hour_utc INTEGER NOT NULL,             -- 0..23 — when to send (UTC)
  lang TEXT NOT NULL DEFAULT 'en',
  token TEXT NOT NULL UNIQUE,            -- random for /unsubscribe links
  subscribed_at INTEGER NOT NULL,        -- unix epoch ms
  last_sent_date TEXT,                   -- YYYY-MM-DD of last successful send
  active INTEGER NOT NULL DEFAULT 1,     -- 0 = unsubscribed
  country TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_hour   ON email_subscribers(hour_utc, active);
CREATE INDEX IF NOT EXISTS idx_email_token  ON email_subscribers(token);
