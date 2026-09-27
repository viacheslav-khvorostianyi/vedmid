-- Ведмідь · initial schema
-- Source of truth for the data model. See docs/ARCHITECTURE.md §4.6–4.7.
-- Apply: supabase db push   (local: supabase db reset)

-- =========================================================================
-- Types
-- =========================================================================
create type public.staff_role as enum ('waiter', 'manager');
create type public.answer_source as enum ('card', 'quiz', 'match', 'recipe', 'guest');
create type public.game_mode as enum ('quiz', 'match', 'recipe', 'guest');

-- =========================================================================
-- Profiles
-- =========================================================================
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  role         public.staff_role not null default 'waiter',
  created_at   timestamptz not null default now()
);

-- Create profile + stats row when an invited user first signs in
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.player_stats (user_id) values (new.id);
  return new;
end $$;

-- Role helper used by RLS policies (security definer avoids RLS recursion on profiles)
create function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'manager');
$$;

-- =========================================================================
-- Menu
-- =========================================================================
create table public.categories (
  id   smallint primary key,
  slug text not null unique check (slug in ('food', 'wine', 'cocktails', 'beer_soft', 'spirits')),
  name text not null,            -- chip label: їжа, вино, коктейлі, пиво, міцні
  legacy_name text not null,     -- MenuItem['category'] value in src/types.ts
  sort smallint not null
);

insert into public.categories (id, slug, name, legacy_name, sort) values
  (1, 'food',      'їжа',      'Їжа',                  1),
  (2, 'wine',      'вино',     'Вино',                 2),
  (3, 'cocktails', 'коктейлі', 'Коктейлі',             3),
  (4, 'beer_soft', 'пиво',     'Безалкогольні & Пиво', 4),
  (5, 'spirits',   'міцні',    'Міцні напої',          5);

create table public.subcategories (
  id          serial primary key,
  category_id smallint not null references public.categories (id),
  name        text not null check (char_length(name) between 1 and 80),
  sort        smallint not null default 0,
  unique (category_id, name)
);

create table public.menu_items (
  id               uuid primary key default gen_random_uuid(),
  legacy_id        text unique,                        -- MenuItem.id from src/data (seed upsert key)
  subcategory_id   int not null references public.subcategories (id),
  title            text not null check (char_length(title) between 1 and 200),
  anchor           text not null default '' check (char_length(anchor) <= 200),
  ingredients      text not null default '' check (char_length(ingredients) <= 2000),
  sales            text not null default '' check (char_length(sales) <= 2000),
  interesting_fact text check (char_length(interesting_fact) <= 2000),
  pairing          text check (char_length(pairing) <= 1000),
  allergens        text[] not null default '{}',
  grape_varieties  text,
  sweetness        text,
  taste_profile    jsonb,   -- { "labels": ["Т","К","С","В"], "values": [0..3] }
  producer         jsonb,   -- { "uniqueness": "", "facilities": "", "rawMaterials": "" }
  is_bestseller    boolean not null default false,
  is_finalist      boolean not null default false,
  photo_path       text,    -- dish-photos/{item_id}/{uuid}.webp
  sort             int not null default 0,
  is_active        boolean not null default true,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references public.profiles (id) on delete set null,
  constraint taste_profile_shape check (
    taste_profile is null or (jsonb_typeof(taste_profile -> 'labels') = 'array'
                              and jsonb_typeof(taste_profile -> 'values') = 'array'))
);
create index menu_items_subcategory_idx on public.menu_items (subcategory_id) where is_active;

create function public.touch_menu_item()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create trigger menu_items_touch before insert or update on public.menu_items
  for each row execute function public.touch_menu_item();

create table public.guest_scenarios (
  id        text primary key,           -- 'g-1' … (from GameTab.guestScenarios)
  persona   text not null,
  avatar    text not null default '',
  quote     text not null,
  options   jsonb not null,             -- [{ "text": "", "isCorrect": bool, "feedback": "" }]
  is_active boolean not null default true,
  sort      int not null default 0
);

-- =========================================================================
-- Progress & gamification
-- =========================================================================
create table public.player_stats (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  xp              int not null default 0 check (xp >= 0),
  streak          int not null default 0,
  max_streak      int not null default 0,
  correct_answers int not null default 0,
  total_answers   int not null default 0,
  updated_at      timestamptz not null default now()
);

-- Trigger defined after player_stats exists
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.card_progress (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  item_id     uuid not null references public.menu_items (id) on delete cascade,
  box         smallint not null default 1 check (box between 1 and 5),
  last_result boolean,
  reviewed_at timestamptz,
  times_seen  int not null default 0,
  times_known int not null default 0,
  primary key (user_id, item_id)
);

create table public.answer_log (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  item_id    uuid references public.menu_items (id) on delete set null,
  source     public.answer_source not null,
  correct    boolean not null,
  xp_awarded int not null default 0,
  created_at timestamptz not null default now()
);
create index answer_log_user_time_idx on public.answer_log (user_id, created_at desc);

create table public.game_results (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  mode       public.game_mode not null,
  score      int not null check (score >= 0),
  total      int not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table public.achievements (
  id          text primary key,
  title       text not null,
  description text not null,
  icon        text not null default '',
  xp_reward   int not null default 0,
  rule        jsonb not null,           -- { "metric": "xp"|"max_streak"|"correct_answers", "gte": 100 }
  sort        int not null default 0
);

create table public.user_achievements (
  user_id        uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- =========================================================================
-- RPCs (the only write path for progress)
-- =========================================================================
create function public.record_answer(p_item_id uuid, p_correct boolean, p_source public.answer_source)
returns table (xp int, level int, streak int, max_streak int, new_achievements text[])
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column  -- OUT params (xp, streak, …) share names with player_stats columns
declare
  v_uid     uuid := auth.uid();
  v_xp      int := 0;
  v_recent  int;
  v_stats   public.player_stats;
  v_new     text[] := '{}';
  v_batch   text[];
  v_bonus   int := 0;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;

  -- XP table (ARCHITECTURE §4.4)
  if p_correct then
    v_xp := case p_source when 'card' then 5 when 'quiz' then 10 when 'match' then 5
                          when 'recipe' then 15 when 'guest' then 20 end;
  end if;

  -- Anti-farming cap: > 120 answers in 10 minutes earn no XP
  select count(*) into v_recent from public.answer_log
   where user_id = v_uid and created_at > now() - interval '10 minutes';
  if v_recent >= 120 then v_xp := 0; end if;

  insert into public.answer_log (user_id, item_id, source, correct, xp_awarded)
  values (v_uid, p_item_id, p_source, p_correct, v_xp);

  -- Leitner update for flashcards
  if p_source = 'card' and p_item_id is not null then
    insert into public.card_progress as cp (user_id, item_id, box, last_result, reviewed_at, times_seen, times_known)
    values (v_uid, p_item_id, case when p_correct then 2 else 1 end, p_correct, now(), 1, p_correct::int)
    on conflict (user_id, item_id) do update set
      box         = case when p_correct then least(cp.box + 1, 5) else 1 end,
      last_result = p_correct,
      reviewed_at = now(),
      times_seen  = cp.times_seen + 1,
      times_known = cp.times_known + p_correct::int;
  end if;

  update public.player_stats s set
    xp              = s.xp + v_xp,
    streak          = case when p_correct then s.streak + 1 else 0 end,
    max_streak      = greatest(s.max_streak, case when p_correct then s.streak + 1 else 0 end),
    correct_answers = s.correct_answers + p_correct::int,
    total_answers   = s.total_answers + 1,
    updated_at      = now()
  where s.user_id = v_uid
  returning * into v_stats;

  -- Unlock achievements whose rule is now satisfied. Bonus XP can satisfy further rules, so repeat until stable.
  loop
    with unlocked as (
      insert into public.user_achievements (user_id, achievement_id)
      select v_uid, a.id from public.achievements a
       where not exists (select 1 from public.user_achievements ua where ua.user_id = v_uid and ua.achievement_id = a.id)
         and (a.rule ->> 'gte')::int <= case a.rule ->> 'metric'
               when 'xp' then v_stats.xp
               when 'max_streak' then v_stats.max_streak
               when 'correct_answers' then v_stats.correct_answers
               else 2147483647 end
      returning achievement_id
    )
    select coalesce(array_agg(achievement_id), '{}') into v_batch from unlocked;

    exit when cardinality(v_batch) = 0;
    v_new := v_new || v_batch;
    select coalesce(sum(a.xp_reward), 0) into v_bonus from public.achievements a where a.id = any (v_batch);
    update public.player_stats s set xp = s.xp + v_bonus where s.user_id = v_uid returning * into v_stats;
  end loop;

  return query select v_stats.xp, (v_stats.xp / 250) + 1, v_stats.streak, v_stats.max_streak, v_new;
end $$;

create function public.finish_game(p_mode public.game_mode, p_score int, p_total int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_score < 0 or p_total < 0 or p_score > p_total or p_total > 100 then
    raise exception 'invalid score' using errcode = '22023';
  end if;
  insert into public.game_results (user_id, mode, score, total) values (auth.uid(), p_mode, p_score, p_total);
end $$;

create function public.set_role(p_user uuid, p_role public.staff_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_manager() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_user = auth.uid() and p_role <> 'manager' then
    raise exception 'managers cannot demote themselves' using errcode = '22023';
  end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

revoke all on function public.record_answer, public.finish_game, public.set_role from public, anon;
grant execute on function public.record_answer, public.finish_game, public.set_role to authenticated;

-- =========================================================================
-- Row Level Security (default deny)
-- =========================================================================
alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.subcategories     enable row level security;
alter table public.menu_items        enable row level security;
alter table public.guest_scenarios   enable row level security;
alter table public.player_stats      enable row level security;
alter table public.card_progress     enable row level security;
alter table public.answer_log        enable row level security;
alter table public.game_results      enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;

-- Profiles: everyone signed in sees names (profile/leaderboard later); users edit own name; role only via set_role
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Reference/menu data: read for all signed-in staff, write for managers
create policy categories_read on public.categories for select to authenticated using (true);
create policy subcategories_read on public.subcategories for select to authenticated using (true);
create policy subcategories_write on public.subcategories for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy menu_read on public.menu_items for select to authenticated using (is_active or public.is_manager());
create policy menu_write on public.menu_items for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy guest_read on public.guest_scenarios for select to authenticated using (is_active or public.is_manager());
create policy guest_write on public.guest_scenarios for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy achievements_read on public.achievements for select to authenticated using (true);

-- Progress: owner reads own rows; managers read all (insights). No direct writes (RPC only).
create policy stats_read on public.player_stats for select to authenticated
  using (user_id = auth.uid() or public.is_manager());
create policy progress_read on public.card_progress for select to authenticated
  using (user_id = auth.uid() or public.is_manager());
create policy answers_read on public.answer_log for select to authenticated
  using (user_id = auth.uid() or public.is_manager());
create policy games_read on public.game_results for select to authenticated
  using (user_id = auth.uid() or public.is_manager());
create policy user_ach_read on public.user_achievements for select to authenticated
  using (user_id = auth.uid() or public.is_manager());

-- =========================================================================
-- Storage: dish photos (public read, manager write)
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-photos', 'dish-photos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy dish_photos_manager_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'dish-photos' and public.is_manager());
create policy dish_photos_manager_update on storage.objects for update to authenticated
  using (bucket_id = 'dish-photos' and public.is_manager());
create policy dish_photos_manager_delete on storage.objects for delete to authenticated
  using (bucket_id = 'dish-photos' and public.is_manager());

-- =========================================================================
-- Seed: achievements (mirrors achievementsList in src/data/menuData.ts)
-- Menu items, subcategories and guest scenarios are seeded by supabase/seed.ts
-- =========================================================================
insert into public.achievements (id, title, description, icon, xp_reward, rule, sort) values
  ('ach-1',     'Стажер ЛІСу',        'Наберіть перші 100 XP знань',               '🌱', 50, '{"metric":"xp","gte":100}',             1),
  ('ach-2', 'Винний Гурман',      'Досягніть серії з 5 правильних відповідей', '🍷', 100, '{"metric":"max_streak","gte":5}',       2),
  ('ach-3', 'Гросмейстер Меню',   'Наберіть 1000 XP знань',                    '🧠', 300, '{"metric":"xp","gte":1000}',            3),
  ('ach-4', 'Ідеальний Офіціант', 'Дайте 30 правильних відповідей у тестах',   '⭐', 200, '{"metric":"correct_answers","gte":30}', 4),
  ('ach-5', 'Незламний серцеїд',  'Дайте 10 правильних відповідей поспіль',    '🔥', 150, '{"metric":"max_streak","gte":10}',      5);
