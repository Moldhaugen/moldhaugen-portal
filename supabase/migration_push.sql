-- Push notification subscriptions (one user can have multiple devices)
CREATE TABLE push_subscriptions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_sub_select_own" ON push_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "push_sub_insert_own" ON push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_sub_delete_own" ON push_subscriptions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Per-user push opt-out flag
ALTER TABLE profiles ADD COLUMN push_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
