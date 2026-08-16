-- Maintenance suggestions table
CREATE TABLE IF NOT EXISTS public.maintenance_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suggestions_select" ON public.maintenance_suggestions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "suggestions_insert" ON public.maintenance_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "suggestions_delete" ON public.maintenance_suggestions
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
