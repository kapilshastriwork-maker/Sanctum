-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Agents table
create table if not exists agents (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  name text not null,
  description text,
  icon text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Connected services table
create table if not exists connected_services (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  agent_id uuid references agents(id) on delete set null,
  service_name text not null,
  service_icon text,
  scopes text[] default '{}',
  is_active boolean default true,
  connected_at timestamptz default now(),
  expires_at timestamptz
);

-- Mission tokens table
create table if not exists mission_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  agent_id uuid references agents(id) on delete cascade,
  service_name text not null,
  scopes text[] default '{}',
  purpose text not null,
  status text default 'active' check (status in ('active', 'expired', 'revoked')),
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

-- Audit events table
create table if not exists audit_events (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  agent_id uuid references agents(id) on delete set null,
  mission_token_id uuid references mission_tokens(id) on delete set null,
  event_type text not null,
  service_name text,
  action text not null,
  scope_used text,
  payload jsonb,
  status text default 'success' check (status in ('success', 'blocked', 'pending_approval', 'denied')),
  ip_address text,
  created_at timestamptz default now()
);

-- Step-up requests table
create table if not exists step_up_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  agent_id uuid references agents(id) on delete cascade,
  mission_token_id uuid references mission_tokens(id) on delete set null,
  action text not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Indexes for fast lookups by user_id
create index if not exists agents_user_id_idx on agents(user_id);
create index if not exists connected_services_user_id_idx on connected_services(user_id);
create index if not exists mission_tokens_user_id_idx on mission_tokens(user_id);
create index if not exists audit_events_user_id_idx on audit_events(user_id);
create index if not exists step_up_requests_user_id_idx on step_up_requests(user_id);

-- Row Level Security (RLS) - users can only see their own data
alter table agents enable row level security;
alter table connected_services enable row level security;
alter table mission_tokens enable row level security;
alter table audit_events enable row level security;
alter table step_up_requests enable row level security;

-- RLS policies
create policy "Users can manage their own agents"
  on agents for all using (user_id = current_user);

create policy "Users can manage their own services"
  on connected_services for all using (user_id = current_user);

create policy "Users can manage their own mission tokens"
  on mission_tokens for all using (user_id = current_user);

create policy "Users can view their own audit events"
  on audit_events for all using (user_id = current_user);

create policy "Users can manage their own step-up requests"
  on step_up_requests for all using (user_id = current_user);
