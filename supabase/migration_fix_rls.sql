-- Fix: infinite recursion between events_select and invitations_select policies
--
-- Root cause:
--   events_select  → queries event_invitations
--   invitations_select → queries events  ← cycle!
--
-- Fix: use a SECURITY DEFINER function for the owner check on event_invitations.
-- SECURITY DEFINER bypasses RLS on events, breaking the cycle.

CREATE OR REPLACE FUNCTION public.is_event_owner(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = p_event_id AND created_by = auth.uid()
  );
$$;

-- Drop the three recursive policies
DROP POLICY IF EXISTS "invitations_select" ON public.event_invitations;
DROP POLICY IF EXISTS "invitations_insert" ON public.event_invitations;
DROP POLICY IF EXISTS "invitations_delete" ON public.event_invitations;

-- Recreate them using the helper function (no more recursion)
CREATE POLICY "invitations_select" ON public.event_invitations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_event_owner(event_id)
  );

CREATE POLICY "invitations_insert" ON public.event_invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_event_owner(event_id));

CREATE POLICY "invitations_delete" ON public.event_invitations
  FOR DELETE TO authenticated
  USING (public.is_event_owner(event_id));
