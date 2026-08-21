alter table tool_requests
  add column if not exists owner_initiated boolean not null default false;
