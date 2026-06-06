-- Supabase Schema for SafeHer OS

-- 1. Users Profile Table (Created automatically on Auth or first login)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  phone text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  relation text,
  ready boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);

-- 3. Keywords Table
CREATE TABLE IF NOT EXISTS public.keywords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  language text DEFAULT 'en',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own keywords" ON public.keywords FOR ALL USING (auth.uid() = user_id);

-- 4. Incidents Table (Reported Incidents)
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- optional
  type text NOT NULL,
  location text NOT NULL,
  description text,
  anonymous boolean DEFAULT true,
  hash text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
-- Incidents can be inserted by authenticated users, but anyone can read (if we want a public map)
CREATE POLICY "Anyone can read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Auth users can insert incidents" ON public.incidents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Evidence Metadata Table
CREATE TABLE IF NOT EXISTS public.evidence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  filename text NOT NULL,
  hash text,
  status text DEFAULT 'SECURED',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own evidence" ON public.evidence FOR ALL USING (auth.uid() = user_id);

-- 6. Live Shares Table (Public tracking links)
CREATE TABLE IF NOT EXISTS public.live_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lat double precision,
  lng double precision,
  expires_at timestamp with time zone NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.live_shares ENABLE ROW LEVEL SECURITY;
-- Anyone can view a live share if they have the ID and it hasn't expired
CREATE POLICY "Public can view active shares" ON public.live_shares FOR SELECT USING (active = true AND expires_at > now());
-- Only the owner can update their share
CREATE POLICY "Users manage own shares" ON public.live_shares FOR ALL USING (auth.uid() = user_id);

-- 7. Community Safety Pins Table (for Community Map)
CREATE TABLE IF NOT EXISTS public.community_pins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL, -- 'unsafe', 'safe', 'incident'
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
  -- no user_id required to allow anonymous posting
);

ALTER TABLE public.community_pins ENABLE ROW LEVEL SECURITY;
-- Public read
CREATE POLICY "Anyone can read community pins" ON public.community_pins FOR SELECT USING (true);
-- Auth users can insert
CREATE POLICY "Auth users can insert community pins" ON public.community_pins FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime for Live Shares
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_shares;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_shares_updated_at
    BEFORE UPDATE ON public.live_shares
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
