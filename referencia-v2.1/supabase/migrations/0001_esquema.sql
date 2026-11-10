-- ReComiendo · esquema inicial
-- Roles: usuario, negocio, superadmin (en profiles.rol; los usuarios no pueden editarlo).
-- Las escrituras sensibles (puntos, premium, rol, métricas) las hace el back end con la
-- clave de servicio, desde /lib/services. RLS protege todo lo que se lee o escribe desde el cliente.

create extension if not exists pgcrypto;
create schema if not exists private;

-- ───────────── Perfiles ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  rol text not null default 'usuario' check (rol in ('usuario', 'negocio', 'superadmin')),
  categorias text[] not null default '{}',
  precio smallint not null default 2 check (precio between 1 and 3),
  modo text not null default 'descubrir' check (modo in ('descubrir', 'seguro')),
  onboarding_ok boolean not null default false,
  -- lo que el algoritmo aprende: { pesos: {categoria: n}, historial: [ids], descartados: [ids] }
  aprendizaje jsonb not null default '{"pesos":{},"historial":[],"descartados":[]}',
  es_premium boolean not null default false,
  premium_desde timestamptz,
  puntos integer not null default 50,
  created_at timestamptz not null default now()
);

-- Crea el perfil al registrarse
create function private.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger al_crear_usuario after insert on auth.users
  for each row execute function private.crear_perfil();

-- Rol del usuario actual (en schema privado, no expuesto por la API)
create function private.rol_actual() returns text
language sql stable security definer set search_path = '' as $$
  select rol from public.profiles where id = (select auth.uid())
$$;

-- Las políticas RLS llaman a rol_actual(); el schema private no está expuesto en la API
revoke all on function private.crear_perfil() from public;
revoke all on function private.rol_actual() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.rol_actual() to anon, authenticated;

-- ───────────── Locales ─────────────
create table public.locales (
  id text primary key,                      -- slug, ej: "hiei-s-sushi"
  owner_id uuid references public.profiles (id) on delete set null,
  nombre text not null,
  categoria text not null check (categoria in ('cafe','mariscos','pizza-pastas','parrilla','cerveza','hamburguesas','sushi','veggie')),
  barrio text not null default '',
  direccion text not null default '',
  lat double precision,
  lng double precision,
  precio smallint not null default 2 check (precio between 1 and 3),
  momentos text[] not null default '{}',
  tags text[] not null default '{}',
  platos text[] not null default '{}',
  descripcion text not null default '',
  instagram text not null default '',
  horarios text not null default '',
  fotos text[] not null default '{}',
  nicho boolean not null default false,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activo', 'suspendido')),
  created_at timestamptz not null default now()
);
create index on public.locales (owner_id);
create index on public.locales (estado, categoria);

-- ───────────── Contenido estilo Instagram ─────────────
create table public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  local_id text not null references public.locales (id) on delete cascade,
  tipo text not null default 'post' check (tipo in ('post', 'promo')),
  texto text not null,
  foto text,
  vence date,                                -- sólo promos
  created_at timestamptz not null default now()
);
create index on public.publicaciones (local_id, created_at desc);

create table public.resenas (
  id uuid primary key default gen_random_uuid(),
  local_id text not null references public.locales (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  autor text not null default '',
  estrellas smallint not null check (estrellas between 1 and 5),
  etiquetas text[] not null default '{}',
  texto text not null default '',
  foto text,
  respuesta text,                            -- respuesta del negocio
  oculta boolean not null default false,     -- moderación del superadmin
  created_at timestamptz not null default now()
);
create index on public.resenas (local_id, created_at desc);
create index on public.resenas (user_id);

create table public.seguidores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_id text not null references public.locales (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, local_id)
);
create index on public.seguidores (local_id);

create table public.favoritos (
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_id text not null references public.locales (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, local_id)
);
create index on public.favoritos (local_id);

-- ───────────── Reservas, premios y Premium ─────────────
create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  local_id text not null references public.locales (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  fecha date not null,
  hora text not null,
  personas smallint not null check (personas between 1 and 20),
  codigo text not null unique,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'cancelada', 'usada')),
  created_at timestamptz not null default now()
);
create index on public.reservas (local_id, fecha);
create index on public.reservas (user_id);

create table public.premios (
  id text primary key,
  titulo text not null,
  local_id text not null references public.locales (id) on delete cascade,
  costo integer not null check (costo > 0),
  activo boolean not null default true
);
create index on public.premios (local_id);

create table public.canjes (
  id uuid primary key default gen_random_uuid(),
  premio_id text not null references public.premios (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  codigo text not null unique,
  usado boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.canjes (user_id);
create index on public.canjes (premio_id);

-- Pagos simulados. proveedor queda listo para 'mercadopago'.
create table public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null default 'premium-mensual',
  monto_usd numeric(10, 2) not null default 2,
  proveedor text not null default 'simulado',
  estado text not null default 'activa' check (estado in ('prueba', 'activa', 'cancelada')),
  inicio timestamptz not null default now(),
  fin timestamptz
);
create index on public.suscripciones (user_id);

create table public.patrocinios (
  id uuid primary key default gen_random_uuid(),
  local_id text not null references public.locales (id) on delete cascade,
  beneficio text not null,
  monto_usd numeric(10, 2) not null default 20,
  inicio date not null default current_date,
  fin date not null default (current_date + 30),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.patrocinios (local_id);

-- ───────────── Analítica ─────────────
-- Fuente de todas las métricas de los paneles.
create table public.events (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in (
    'view_local', 'click_instagram', 'click_como_llegar', 'reserva', 'canje',
    'compra_premium', 'impresion_anuncio', 'click_anuncio', 'resena', 'seguir',
    'recomendacion', 'registro', 'sesion'
  )),
  user_id uuid references public.profiles (id) on delete set null,
  local_id text references public.locales (id) on delete set null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.events (created_at);
create index on public.events (local_id, tipo, created_at);
create index on public.events (user_id);

-- ───────────── Permisos y RLS ─────────────
alter table public.profiles enable row level security;
alter table public.locales enable row level security;
alter table public.publicaciones enable row level security;
alter table public.resenas enable row level security;
alter table public.seguidores enable row level security;
alter table public.favoritos enable row level security;
alter table public.reservas enable row level security;
alter table public.premios enable row level security;
alter table public.canjes enable row level security;
alter table public.suscripciones enable row level security;
alter table public.patrocinios enable row level security;
alter table public.events enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.locales, public.publicaciones, public.resenas, public.premios, public.patrocinios to anon, authenticated;
grant select on public.profiles, public.seguidores, public.favoritos, public.reservas, public.canjes, public.suscripciones to authenticated;
grant insert, delete on public.seguidores, public.favoritos to authenticated;
grant insert, update, delete on public.publicaciones to authenticated;
grant insert on public.resenas to authenticated;
grant update (respuesta) on public.resenas to authenticated;
grant update (nombre, categorias, precio, modo, onboarding_ok, aprendizaje) on public.profiles to authenticated;
grant update (nombre, barrio, direccion, lat, lng, precio, momentos, tags, platos, descripcion, instagram, horarios, fotos) on public.locales to authenticated;
grant update (estado) on public.reservas to authenticated;
-- events, canjes, suscripciones, puntos y premium se escriben sólo desde el back end (service role)

-- profiles: cada uno ve el suyo; el superadmin ve todos
create policy "perfil propio" on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select private.rol_actual()) = 'superadmin');
create policy "editar perfil propio" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- locales: activos son públicos; el dueño ve y edita el suyo
create policy "locales visibles" on public.locales for select to anon, authenticated
  using (estado = 'activo' or owner_id = (select auth.uid()) or (select private.rol_actual()) = 'superadmin');
create policy "dueño edita su local" on public.locales for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- publicaciones: públicas; el dueño del local las gestiona
create policy "publicaciones visibles" on public.publicaciones for select to anon, authenticated using (true);
create policy "dueño publica" on public.publicaciones for insert to authenticated
  with check (exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())));
create policy "dueño edita publicación" on public.publicaciones for update to authenticated
  using (exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())));
create policy "dueño borra publicación" on public.publicaciones for delete to authenticated
  using (exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())));

-- reseñas: visibles si no están ocultas; cada uno publica las suyas; el dueño responde
create policy "reseñas visibles" on public.resenas for select to anon, authenticated
  using (not oculta or user_id = (select auth.uid()) or (select private.rol_actual()) = 'superadmin');
create policy "publicar reseña" on public.resenas for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "dueño responde" on public.resenas for update to authenticated
  using (exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())));

-- seguidores y favoritos: propios; el dueño ve quién lo sigue (para métricas)
create policy "ver seguidores" on public.seguidores for select to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())));
create policy "seguir" on public.seguidores for insert to authenticated with check (user_id = (select auth.uid()));
create policy "dejar de seguir" on public.seguidores for delete to authenticated using (user_id = (select auth.uid()));
create policy "ver favoritos" on public.favoritos for select to authenticated using (user_id = (select auth.uid()));
create policy "guardar favorito" on public.favoritos for insert to authenticated with check (user_id = (select auth.uid()));
create policy "quitar favorito" on public.favoritos for delete to authenticated using (user_id = (select auth.uid()));

-- reservas: el usuario ve las suyas; el negocio ve y actualiza las de su local
create policy "ver reservas" on public.reservas for select to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())));
create policy "actualizar reservas" on public.reservas for update to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())))
  with check (user_id = (select auth.uid()) or exists (select 1 from public.locales l where l.id = local_id and l.owner_id = (select auth.uid())));

-- premios y patrocinios: públicos
create policy "premios visibles" on public.premios for select to anon, authenticated using (activo);
create policy "patrocinios visibles" on public.patrocinios for select to anon, authenticated using (activo and current_date between inicio and fin);

-- canjes: el usuario ve los suyos; el negocio ve los de sus premios
create policy "ver canjes" on public.canjes for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.premios p join public.locales l on l.id = p.local_id
    where p.id = premio_id and l.owner_id = (select auth.uid())));

create policy "ver suscripción propia" on public.suscripciones for select to authenticated
  using (user_id = (select auth.uid()));

-- events: sin políticas → sólo el back end (service role) lee y escribe

-- ───────────── Storage para fotos ─────────────
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true)
  on conflict (id) do nothing;
create policy "subir fotos propias" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
