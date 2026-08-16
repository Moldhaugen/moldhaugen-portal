-- ============================================================
-- Moldhaugen Neighborhood Portal – Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (mirrors auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  email       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create a profile row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- EVENTS (calendar)
-- ============================================================
CREATE TABLE public.events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  location     TEXT,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  is_public    BOOLEAN DEFAULT TRUE NOT NULL,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- EVENT INVITATIONS
-- ============================================================
CREATE TABLE public.event_invitations (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (event_id, user_id)
);

-- ============================================================
-- MAINTENANCE PLANS
-- ============================================================
CREATE TABLE public.maintenance_plans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  recurrence  TEXT DEFAULT 'weekly' CHECK (recurrence IN ('weekly', 'biweekly', 'monthly', 'custom')),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- MAINTENANCE ASSIGNMENTS
-- ============================================================
CREATE TABLE public.maintenance_assignments (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id        UUID REFERENCES public.maintenance_plans(id) ON DELETE CASCADE NOT NULL,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  is_completed   BOOLEAN DEFAULT FALSE NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles: any authenticated user can read; only own row can be updated
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Events: read public events OR events you created OR events you are invited to
CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated
  USING (
    is_public = true
    OR created_by = auth.uid()
    OR id IN (
      SELECT event_id FROM public.event_invitations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "events_update_own" ON public.events
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "events_delete_own" ON public.events
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Event invitations
CREATE POLICY "invitations_select" ON public.event_invitations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  );

CREATE POLICY "invitations_insert" ON public.event_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  );

CREATE POLICY "invitations_delete" ON public.event_invitations
  FOR DELETE TO authenticated
  USING (
    event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  );

-- Maintenance plans: all authenticated users can read; only creator can modify
CREATE POLICY "plans_select" ON public.maintenance_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "plans_insert" ON public.maintenance_plans
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "plans_update_own" ON public.maintenance_plans
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "plans_delete_own" ON public.maintenance_plans
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Maintenance assignments: all authenticated users can read; creator of plan can modify
CREATE POLICY "assignments_select" ON public.maintenance_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assignments_insert" ON public.maintenance_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    plan_id IN (SELECT id FROM public.maintenance_plans WHERE created_by = auth.uid())
  );

CREATE POLICY "assignments_update" ON public.maintenance_assignments
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR plan_id IN (SELECT id FROM public.maintenance_plans WHERE created_by = auth.uid())
  );

CREATE POLICY "assignments_delete" ON public.maintenance_assignments
  FOR DELETE TO authenticated
  USING (
    plan_id IN (SELECT id FROM public.maintenance_plans WHERE created_by = auth.uid())
  );
