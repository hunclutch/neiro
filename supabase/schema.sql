-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Videos table
create table public.videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text not null,
  audio_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Covers table
create table public.covers (
  id uuid default uuid_generate_v4() primary key,
  original_video_id uuid references public.videos(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  cover_video_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Likes table
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id)
);

-- Comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references public.videos(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 500),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================
-- Row Level Security (RLS)
-- ========================

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.covers enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are publicly viewable" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Videos: anyone can read, only owner can insert/delete
create policy "Videos are publicly viewable" on public.videos
  for select using (true);

create policy "Authenticated users can insert videos" on public.videos
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own videos" on public.videos
  for delete using (auth.uid() = user_id);

-- Covers: anyone can read, authenticated users can insert
create policy "Covers are publicly viewable" on public.covers
  for select using (true);

create policy "Authenticated users can insert covers" on public.covers
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own covers" on public.covers
  for delete using (auth.uid() = user_id);

-- Likes: anyone can read, authenticated users can manage their own
create policy "Likes are publicly viewable" on public.likes
  for select using (true);

create policy "Authenticated users can insert likes" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own likes" on public.likes
  for delete using (auth.uid() = user_id);

-- ========================
-- Trigger: auto-create profile on signup
-- ========================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========================
-- Storage buckets
-- ========================

-- Run these in Supabase dashboard Storage section or via API:
-- insert into storage.buckets (id, name, public) values ('videos', 'videos', true);

-- Storage policies (add after creating bucket):
-- create policy "Videos are publicly accessible" on storage.objects
--   for select using (bucket_id = 'videos');
-- create policy "Authenticated users can upload videos" on storage.objects
--   for insert with check (bucket_id = 'videos' and auth.role() = 'authenticated');
-- create policy "Users can delete their own videos" on storage.objects
--   for delete using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Comments RLS
create policy "Comments are publicly viewable" on public.comments
  for select using (true);

create policy "Authenticated users can insert comments" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);
