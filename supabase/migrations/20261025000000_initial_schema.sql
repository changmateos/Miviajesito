-- Initial schema for Mi Viajecito App
-- Run this in your Supabase SQL Editor

-- 1. Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Trips table
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  destination_city text not null,
  destination_country text not null default '',
  start_date date,
  end_date date,
  hotel_name text,
  hotel_lat double precision,
  hotel_lng double precision,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Trip Members (Roles: organizer, collaborator)
create table if not exists public.trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('organizer', 'collaborator')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(trip_id, user_id)
);

-- Auto-add creator as organizer in trip_members
create or replace function public.handle_new_trip()
returns trigger as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'organizer');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_new_trip();

-- 4. Places (Points of interest)
create table if not exists public.places (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  name text not null,
  lat double precision,
  lng double precision,
  is_located boolean not null default true,
  pros text[] default '{}'::text[],
  cons text[] default '{}'::text[],
  source_video_url text,
  day_number integer,
  visit_order integer default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Votes (Thumbs up / Like on proposed places)
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  place_id uuid references public.places(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(place_id, user_id)
);

-- 6. Tickets (Billetera "Llave en mano")
create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  place_id uuid references public.places(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'image')),
  is_group boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage bucket for tickets (create via Supabase Dashboard or script)
-- insert into storage.buckets (id, name, public) values ('tickets', 'tickets', true);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.places enable row level security;
alter table public.votes enable row level security;
alter table public.tickets enable row level security;

-- RLS Policies
create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trip policies
create policy "Members can view trips"
  on public.trips for select
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "Users can create trips"
  on public.trips for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Organizers can update their trips"
  on public.trips for update
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
      and trip_members.user_id = auth.uid()
      and trip_members.role = 'organizer'
    )
  );

create policy "Organizers can delete their trips"
  on public.trips for delete
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trips.id
      and trip_members.user_id = auth.uid()
      and trip_members.role = 'organizer'
    )
  );

-- Trip Members policies
create policy "Members can view other members of their trip"
  on public.trip_members for select
  to authenticated
  using (
    exists (
      select 1 from public.trip_members as tm
      where tm.trip_id = trip_members.trip_id
      and tm.user_id = auth.uid()
    )
  );

create policy "Users can join trips via invite"
  on public.trip_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Places policies
create policy "Trip members can view places"
  on public.places for select
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = places.trip_id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "Trip members can propose places"
  on public.places for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = places.trip_id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "Organizers can update places"
  on public.places for update
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = places.trip_id
      and trip_members.user_id = auth.uid()
      and trip_members.role = 'organizer'
    )
  );

create policy "Organizers can delete places"
  on public.places for delete
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = places.trip_id
      and trip_members.user_id = auth.uid()
      and trip_members.role = 'organizer'
    )
  );

-- Votes policies
create policy "Trip members can view votes"
  on public.votes for select
  to authenticated
  using (
    exists (
      select 1 from public.places
      join public.trip_members on trip_members.trip_id = places.trip_id
      where places.id = votes.place_id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "Trip members can vote on places"
  on public.votes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.places
      join public.trip_members on trip_members.trip_id = places.trip_id
      where places.id = votes.place_id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "Users can remove their own votes"
  on public.votes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Tickets policies
create policy "Trip members can view group tickets or own tickets"
  on public.tickets for select
  to authenticated
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = tickets.trip_id
      and trip_members.user_id = auth.uid()
    )
    and (is_group = true or user_id = auth.uid())
  );

create policy "Trip members can upload tickets"
  on public.tickets for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.trip_members
      where trip_members.trip_id = tickets.trip_id
      and trip_members.user_id = auth.uid()
    )
  );

create policy "Users can delete their own tickets"
  on public.tickets for delete
  to authenticated
  using (auth.uid() = user_id);
