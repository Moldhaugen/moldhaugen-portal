-- ============================================================
-- Migration: Add unit_number, is_approved, is_admin to profiles
-- Run this in your Supabase SQL editor AFTER schema.sql
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unit_number TEXT,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS is_admin    BOOLEAN DEFAULT FALSE NOT NULL;

-- Update trigger to also store unit_number on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, unit_number, is_approved, is_admin)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'unit_number',
    FALSE,
    FALSE
  );
  RETURN NEW;
END;
$$;

-- Allow admins to approve/reject other users
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to delete profiles (reject/remove users)
CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================================
-- IMPORTANT: After running this, make yourself an admin by running:
-- UPDATE public.profiles SET is_approved = TRUE, is_admin = TRUE
-- WHERE email = 'your@email.com';
-- ============================================================
