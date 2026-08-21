create table tool_requests (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid references tools(id) on delete cascade not null,
  requester_id uuid references profiles(id) on delete cascade not null,
  message text not null,
  borrow_from date not null,
  borrow_until date not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  constraint tool_requests_status_check check (status in ('pending', 'approved', 'declined'))
);

alter table tool_requests enable row level security;

create policy "Approved users can view tool requests"
  on tool_requests for select
  using (exists (select 1 from profiles where id = auth.uid() and is_approved = true));

create policy "Users can insert own requests"
  on tool_requests for insert
  with check (auth.uid() = requester_id);

create policy "Tool owners can update request status"
  on tool_requests for update
  using (exists (select 1 from tools where id = tool_id and user_id = auth.uid()));

create policy "Requesters can delete own pending requests"
  on tool_requests for delete
  using (auth.uid() = requester_id and status = 'pending');
