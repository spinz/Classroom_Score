-- ─────────────────────────────────────────────
-- Classroom Score — Supabase Schema
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────

-- Students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Points table (earning)
CREATE TABLE points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  awarded_by UUID REFERENCES auth.users(id)
);

-- Rewards catalog (the shop items)
CREATE TABLE rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL CHECK (cost > 0),
  stock INTEGER,  -- NULL = unlimited
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions (spending log)
CREATE TABLE redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id),
  cost INTEGER NOT NULL,  -- snapshot of cost at time of purchase
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES auth.users(id)
);

-- ── Row Level Security ──
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read/write
CREATE POLICY "Auth read students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert students" ON students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth delete students" ON students FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth read points" ON points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert points" ON points FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth delete points" ON points FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth read rewards" ON rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth manage rewards" ON rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth read redemptions" ON redemptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert redemptions" ON redemptions FOR INSERT TO authenticated WITH CHECK (true);
