-- Datos de contacto que deja un negocio al pedir el alta. Van en una tabla aparte porque
-- locales se puede leer públicamente: el teléfono sólo lo ve el equipo (clave de servicio).
create table public.contactos_negocio (
  local_id text primary key references public.locales (id) on delete cascade,
  responsable text not null default '',
  telefono text not null default '',
  created_at timestamptz not null default now()
);
alter table public.contactos_negocio enable row level security;
revoke all on public.contactos_negocio from anon, authenticated;
