-- Newer Supabase projects no longer auto-grant table privileges to service_role.
-- The server (service-role / secret key) needs these to save votes and run admin reset/reseed.
-- anon / authenticated still have NO access to raw responses.
grant select, insert, delete on public.poll_responses to service_role;
grant select, insert, update, delete on public.poll_rate_limits to service_role;
