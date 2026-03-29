-- Add this function to your Supabase SQL Editor (after running supabase-schema.sql)
-- It safely increments the generation counter

create or replace function increment_generations(user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set generations_used = generations_used + 1
  where id = user_id;
end;
$$;
