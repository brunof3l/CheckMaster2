create extension if not exists pgcrypto;

create type checklist_status as enum ('em_andamento', 'finalizado', 'cancelado');

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  role text check (role in ('admin','user')) not null default 'user',
  created_at timestamp with time zone default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  model text,
  active boolean not null default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamp with time zone default now()
);

create sequence if not exists public.checklist_seq start 1;

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  seq bigint not null default nextval('public.checklist_seq'),
  status checklist_status not null default 'em_andamento',
  created_by uuid not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  notes text,
  media jsonb not null default '[]'::jsonb,
  items jsonb,
  "budgetAttachments" jsonb,
  "fuelGaugePhotos" jsonb,
  is_locked boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_checklists_created_at on public.checklists(created_at desc);
create index if not exists idx_checklists_status on public.checklists(status);
create index if not exists idx_checklists_vehicle on public.checklists(vehicle_id);
create index if not exists idx_checklists_supplier on public.checklists(supplier_id);

