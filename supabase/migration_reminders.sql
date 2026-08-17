ALTER TABLE maintenance_assignments
  ADD COLUMN scheduled_time             TIME,
  ADD COLUMN reminder_day_before_sent_at TIMESTAMPTZ,
  ADD COLUMN reminder_on_day_sent_at     TIMESTAMPTZ;
