-- Phase 2: server-side daily usage enforcement.
-- Free users get 3 calculation previews per UTC day. Pro users are unlimited.
create or replace function public.consume_calculation()
returns table(allowed boolean, calculation_count integer, daily_limit integer, plan text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_plan text := 'free';
  current_count integer := 0;
  max_count integer := 3;
begin
  if uid is null then
    return query select false, 0, 3, 'anonymous'::text;
    return;
  end if;

  select coalesce(s.plan, 'free')
    into current_plan
    from public.subscriptions s
   where s.user_id = uid;

  if current_plan in ('pro_monthly','pro_yearly') then
    insert into public.usage_daily(user_id, usage_date, calculation_count)
    values(uid, current_date, 1)
    on conflict (user_id, usage_date)
    do update set calculation_count = public.usage_daily.calculation_count + 1;

    select calculation_count into current_count
      from public.usage_daily
     where user_id = uid and usage_date = current_date;

    return query select true, current_count, 0, current_plan;
    return;
  end if;

  select coalesce(u.calculation_count, 0)
    into current_count
    from public.usage_daily u
   where u.user_id = uid and u.usage_date = current_date;

  if current_count >= max_count then
    return query select false, current_count, max_count, 'free'::text;
    return;
  end if;

  insert into public.usage_daily(user_id, usage_date, calculation_count)
  values(uid, current_date, current_count + 1)
  on conflict (user_id, usage_date)
  do update set calculation_count = public.usage_daily.calculation_count + 1;

  return query select true, current_count + 1, max_count, 'free'::text;
end;
$$;

revoke all on function public.consume_calculation() from public;
grant execute on function public.consume_calculation() to authenticated;
