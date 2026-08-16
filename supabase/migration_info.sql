-- Info entries table
CREATE TABLE IF NOT EXISTS public.info_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  phone_number TEXT,
  category TEXT NOT NULL DEFAULT 'Annet',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.info_entries ENABLE ROW LEVEL SECURITY;

-- Approved users can read
CREATE POLICY "Approved users can read info entries"
  ON public.info_entries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = TRUE)
  );

-- Approved users can insert
CREATE POLICY "Approved users can insert info entries"
  ON public.info_entries FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = TRUE)
  );

-- Creator or admin can delete
CREATE POLICY "Creator or admin can delete info entries"
  ON public.info_entries FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
