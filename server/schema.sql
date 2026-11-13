-- One row per install that turned email reminders on
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,         -- random install ID made by the extension
  token TEXT NOT NULL,         -- random secret; every later request must carry it
  email TEXT NOT NULL,
  tz TEXT NOT NULL DEFAULT 'Asia/Tehran',
  confirmed INTEGER NOT NULL DEFAULT 0,
  code TEXT NOT NULL,          -- in the confirm link and every email's "stop" link
  code_at INTEGER NOT NULL     -- when the last confirmation email went out (ms)
);

-- The install's unfinished upcoming tasks; replaced on every upload
CREATE TABLE IF NOT EXISTS reminders (
  sub_id TEXT NOT NULL,
  key TEXT NOT NULL,           -- the task's ID in the extension
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  url TEXT NOT NULL,
  at INTEGER NOT NULL,         -- deadline (ms)
  sent INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (sub_id, key)
);
CREATE INDEX IF NOT EXISTS reminders_at ON reminders (sent, at);
