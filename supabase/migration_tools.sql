create table tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text,
  available boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tools enable row level security;

create policy "Approved users can view tools"
  on tools for select
  using (exists (select 1 from profiles where id = auth.uid() and is_approved = true));

create policy "Users can insert own tools"
  on tools for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tools"
  on tools for update
  using (auth.uid() = user_id);

create policy "Users can delete own tools"
  on tools for delete
  using (auth.uid() = user_id);
