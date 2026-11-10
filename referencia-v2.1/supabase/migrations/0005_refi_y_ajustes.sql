-- Ajustes de la plataforma que sólo maneja el superadmin (ej.: API key de Claude para Refi).
-- Sin grants: sólo se leen y escriben desde el back end con la clave de servicio.
create table public.ajustes (
  clave text primary key,
  valor text not null,
  updated_at timestamptz not null default now()
);
alter table public.ajustes enable row level security;
revoke all on public.ajustes from anon, authenticated;

-- Cada consulta a Refi: sirve para el límite del plan gratis (1 por semana).
create table public.refi_consultas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null default 'texto' check (tipo in ('texto', 'audio')),
  texto text not null default '',
  created_at timestamptz not null default now()
);
create index on public.refi_consultas (user_id, created_at desc);
alter table public.refi_consultas enable row level security;
revoke all on public.refi_consultas from anon, authenticated;
