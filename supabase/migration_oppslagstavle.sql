-- Bulletin board posts
CREATE TABLE IF NOT EXISTS public.bulletin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comments on posts
CREATE TABLE IF NOT EXISTS public.bulletin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.bulletin_posts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bulletin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_comments ENABLE ROW LEVEL SECURITY;

-- Posts: all approved users can read and post
CREATE POLICY "posts_select" ON public.bulletin_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "posts_insert" ON public.bulletin_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "posts_delete" ON public.bulletin_posts
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Comments: all approved users can read and comment
CREATE POLICY "comments_select" ON public.bulletin_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "comments_insert" ON public.bulletin_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "comments_delete" ON public.bulletin_comments
  FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
