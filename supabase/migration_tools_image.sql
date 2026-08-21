-- Add image_url column to tools
alter table tools add column if not exists image_url text;

-- Create a public storage bucket for tool images
-- Run this in the Supabase dashboard Storage section, or via SQL:
insert into storage.buckets (id, name, public)
values ('tools', 'tools', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Users can upload tool images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'tools' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own images
create policy "Users can update their tool images"
on storage.objects for update
to authenticated
using (bucket_id = 'tools' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own images
create policy "Users can delete their tool images"
on storage.objects for delete
to authenticated
using (bucket_id = 'tools' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to read tool images (public bucket)
create policy "Tool images are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'tools');
