
-- Study Rooms
CREATE TABLE public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  video_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_members INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active rooms" ON public.study_rooms FOR SELECT USING (auth.uid() IS NOT NULL AND (is_active = true OR created_by = auth.uid()));
CREATE POLICY "Users can create rooms" ON public.study_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update rooms" ON public.study_rooms FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete rooms" ON public.study_rooms FOR DELETE USING (auth.uid() = created_by);

-- Study Room Members
CREATE TABLE public.study_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.study_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room members" ON public.study_room_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can join rooms" ON public.study_room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.study_room_members FOR DELETE USING (auth.uid() = user_id);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);
