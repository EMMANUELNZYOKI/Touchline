-- 1. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'coach')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create PLAYERS Table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  position TEXT NOT NULL,
  secondary_position TEXT,
  preferred_foot TEXT,
  jersey_number INT,
  player_photo TEXT,
  height NUMERIC,
  weight NUMERIC,
  emergency_contact TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create PLAYER EVALUATIONS Table
CREATE TABLE IF NOT EXISTS public.player_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technical_score NUMERIC(4,2),
  tactical_score NUMERIC(4,2),
  physical_score NUMERIC(4,2),
  personality_score NUMERIC(4,2),
  overall_rating NUMERIC(4,2),
  detailed_scores JSONB DEFAULT '{}'::jsonb,
  strengths TEXT,
  weaknesses TEXT,
  development_goals TEXT,
  coach_verdict TEXT,
  coach_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to ensure clean execution
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Super admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches manage own players" ON public.players;
DROP POLICY IF EXISTS "Super admin view all players" ON public.players;
DROP POLICY IF EXISTS "Coaches manage own evaluations" ON public.player_evaluations;
DROP POLICY IF EXISTS "Super admin view all evaluations" ON public.player_evaluations;

-- 6. Create Security Policies
CREATE POLICY "Profiles read policy" ON public.profiles 
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Profiles insert policy" ON public.profiles 
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Coaches manage own players" ON public.players 
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Super admin view all players" ON public.players 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Coaches manage own evaluations" ON public.player_evaluations 
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Super admin view all evaluations" ON public.player_evaluations 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));