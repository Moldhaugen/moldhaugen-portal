ALTER TABLE profiles ADD COLUMN email_event_notifications         BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN email_maintenance_notifications   BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN email_announcement_notifications  BOOLEAN NOT NULL DEFAULT TRUE;
