-- Make scheduled_date optional on assignments
ALTER TABLE public.maintenance_assignments
  ALTER COLUMN scheduled_date DROP NOT NULL;
