-- ============================================================
-- IntelliTwin Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Tasks table (Planner)
CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  time        TEXT,
  duration    TEXT,
  priority    TEXT DEFAULT 'Medium',
  category    TEXT DEFAULT 'Today',
  completed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Files table (Upload Dashboard)
CREATE TABLE IF NOT EXISTS files (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT,
  size          TEXT,
  date          TEXT,
  category      TEXT,
  status        TEXT DEFAULT 'Uploading',
  progress      INTEGER DEFAULT 0,
  url           TEXT,
  analysis_json JSONB,
  user_id       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (user preferences — single row, id=1)
CREATE TABLE IF NOT EXISTS settings (
  id                 INTEGER PRIMARY KEY DEFAULT 1,
  name               TEXT DEFAULT 'Alex Student',
  email              TEXT DEFAULT 'alex@intellitwin.ai',
  study_goal         TEXT DEFAULT 'Master Computer Science fundamentals',
  daily_hours        INTEGER DEFAULT 4,
  learning_pace      TEXT DEFAULT 'Medium',
  difficulty_level   TEXT DEFAULT 'Intermediate',
  focus_subjects     JSONB DEFAULT '["Data Structures","Algorithms","OS"]',
  theme              TEXT DEFAULT 'dark',
  accent_color       TEXT DEFAULT '#00f2fe',
  notifications_json JSONB DEFAULT '{}',
  ai_json            JSONB DEFAULT '{}',
  appearance_json    JSONB DEFAULT '{}',
  last_active        TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable Realtime on tasks and files
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
