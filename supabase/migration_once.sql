-- Add 'once' as a valid recurrence option
ALTER TABLE public.maintenance_plans
  DROP CONSTRAINT IF EXISTS maintenance_plans_recurrence_check;

ALTER TABLE public.maintenance_plans
  ADD CONSTRAINT maintenance_plans_recurrence_check
  CHECK (recurrence IN ('weekly', 'biweekly', 'monthly', 'custom', 'once'));
