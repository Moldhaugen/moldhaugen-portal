-- Add is_completed to maintenance plans
ALTER TABLE public.maintenance_plans
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Trigger function: auto-complete plan when all its assignments are done
CREATE OR REPLACE FUNCTION public.sync_plan_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.maintenance_plans
  SET is_completed = (
    SELECT COALESCE(bool_and(is_completed), FALSE)
    FROM public.maintenance_assignments
    WHERE plan_id = NEW.plan_id
  )
  WHERE id = NEW.plan_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_assignment_completion_change
  AFTER UPDATE OF is_completed ON public.maintenance_assignments
  FOR EACH ROW EXECUTE FUNCTION public.sync_plan_completion();
