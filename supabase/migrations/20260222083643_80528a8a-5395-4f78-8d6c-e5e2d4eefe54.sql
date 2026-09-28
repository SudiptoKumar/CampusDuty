
-- Marketplace Listings
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  condition TEXT NOT NULL DEFAULT 'used',
  image_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings" ON public.marketplace_listings
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own listings" ON public.marketplace_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings" ON public.marketplace_listings
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own listings" ON public.marketplace_listings
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Campus Events
CREATE TABLE public.campus_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  event_type TEXT NOT NULL DEFAULT 'general',
  created_by UUID NOT NULL,
  faculty TEXT,
  is_global BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view events" ON public.campus_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and CRs can create events" ON public.campus_events
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'cr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and creators can update events" ON public.campus_events
  FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and creators can delete events" ON public.campus_events
  FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Tutor Profiles
CREATE TABLE public.tutor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subjects TEXT[] DEFAULT '{}',
  availability TEXT,
  rate TEXT DEFAULT 'free',
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tutor profiles" ON public.tutor_profiles
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own tutor profile" ON public.tutor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutor profile" ON public.tutor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tutor profile" ON public.tutor_profiles
  FOR DELETE USING (auth.uid() = user_id);
