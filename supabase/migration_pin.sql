-- Add pinning to bulletin posts
ALTER TABLE public.bulletin_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow admins to update posts (for pinning)
CREATE POLICY "posts_update_admin" ON public.bulletin_posts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
