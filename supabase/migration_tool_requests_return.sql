-- Add "returned" as a valid status for tool requests
alter table tool_requests drop constraint tool_requests_status_check;
alter table tool_requests add constraint tool_requests_status_check
  check (status in ('pending', 'approved', 'declined', 'returned'));
