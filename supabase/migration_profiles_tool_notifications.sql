alter table profiles
  add column if not exists email_tool_notifications boolean not null default true;
