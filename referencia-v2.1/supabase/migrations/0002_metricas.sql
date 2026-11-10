-- Funciones de métricas. Sólo las puede ejecutar el back end (service_role):
-- los paneles las llaman desde /lib/services/metricas.ts después de verificar el rol.

-- Señales para el algoritmo: rating, cantidad de reseñas y popularidad (30 días)
create function public.senales_locales()
returns table (local_id text, rating numeric, cantidad_resenas bigint, popularidad bigint)
language sql stable set search_path = '' as $$
  select l.id,
         coalesce(round(avg(r.estrellas)::numeric, 1), 0),
         count(r.id),
         coalesce((select count(*) from public.events e
                   where e.local_id = l.id and e.tipo in ('view_local', 'reserva')
                     and e.created_at > now() - interval '30 days'), 0)
  from public.locales l
  left join public.resenas r on r.local_id = l.id and not r.oculta
  group by l.id
$$;

-- KPIs generales del superadmin
create function public.metricas_admin(desde timestamptz, hasta timestamptz)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'usuarios_totales', (select count(*) from public.profiles where rol = 'usuario'),
    'usuarios_nuevos', (select count(*) from public.profiles where rol = 'usuario' and created_at between desde and hasta),
    'usuarios_activos', (select count(distinct user_id) from public.events where user_id is not null and created_at between desde and hasta),
    'activos_hoy', (select count(distinct user_id) from public.events where user_id is not null and created_at > now() - interval '1 day'),
    'locales_activos', (select count(*) from public.locales where estado = 'activo'),
    'locales_pendientes', (select count(*) from public.locales where estado = 'pendiente'),
    'locales_suspendidos', (select count(*) from public.locales where estado = 'suspendido'),
    'premium_total', (select count(*) from public.profiles where es_premium),
    'premium_nuevos', (select count(*) from public.events where tipo = 'compra_premium' and created_at between desde and hasta),
    'mrr_usd', (select coalesce(sum(monto_usd), 0) from public.suscripciones where estado = 'activa'),
    'patrocinios_activos', (select count(*) from public.patrocinios where activo and current_date between inicio and fin),
    'ingresos_patrocinios_usd', (select coalesce(sum(monto_usd), 0) from public.patrocinios where activo and current_date between inicio and fin),
    'vistas', (select count(*) from public.events where tipo = 'view_local' and created_at between desde and hasta),
    'clicks', (select count(*) from public.events where tipo in ('click_instagram', 'click_como_llegar', 'click_anuncio') and created_at between desde and hasta),
    'reservas', (select count(*) from public.events where tipo = 'reserva' and created_at between desde and hasta),
    'resenas', (select count(*) from public.events where tipo = 'resena' and created_at between desde and hasta),
    'canjes', (select count(*) from public.events where tipo = 'canje' and created_at between desde and hasta),
    'impresiones_anuncios', (select count(*) from public.events where tipo = 'impresion_anuncio' and created_at between desde and hasta),
    'clicks_anuncios', (select count(*) from public.events where tipo = 'click_anuncio' and created_at between desde and hasta)
  )
$$;

-- Serie diaria por tipo de evento (opcionalmente de un solo local)
create function public.serie_eventos(desde timestamptz, hasta timestamptz, local text default null)
returns table (dia date, tipo text, cantidad bigint)
language sql stable set search_path = '' as $$
  select (created_at at time zone 'America/Argentina/Buenos_Aires')::date, tipo, count(*)
  from public.events
  where created_at between desde and hasta and (local is null or local_id = local)
  group by 1, 2
  order by 1
$$;

-- Usuarios activos por día
create function public.activos_por_dia(desde timestamptz, hasta timestamptz)
returns table (dia date, activos bigint, nuevos bigint)
language sql stable set search_path = '' as $$
  with dias as (
    select generate_series((desde at time zone 'America/Argentina/Buenos_Aires')::date,
                           (hasta at time zone 'America/Argentina/Buenos_Aires')::date, '1 day')::date as dia
  )
  select d.dia,
         (select count(distinct e.user_id) from public.events e
           where e.user_id is not null and (e.created_at at time zone 'America/Argentina/Buenos_Aires')::date = d.dia),
         (select count(*) from public.profiles p
           where p.rol = 'usuario' and (p.created_at at time zone 'America/Argentina/Buenos_Aires')::date = d.dia)
  from dias d order by d.dia
$$;

-- Ranking de locales
create function public.ranking_locales(desde timestamptz, hasta timestamptz)
returns table (local_id text, nombre text, categoria text, vistas bigint, clicks bigint, reservas bigint, seguidores bigint)
language sql stable set search_path = '' as $$
  select l.id, l.nombre, l.categoria,
         count(*) filter (where e.tipo = 'view_local'),
         count(*) filter (where e.tipo in ('click_instagram', 'click_como_llegar')),
         count(*) filter (where e.tipo = 'reserva'),
         (select count(*) from public.seguidores s where s.local_id = l.id)
  from public.locales l
  left join public.events e on e.local_id = l.id and e.created_at between desde and hasta
  where l.estado = 'activo'
  group by l.id
  order by 4 desc
$$;

-- KPIs de un local (panel de negocios)
create function public.metricas_local(local text, desde timestamptz, hasta timestamptz)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'vistas', count(*) filter (where tipo = 'view_local'),
    'clicks_instagram', count(*) filter (where tipo = 'click_instagram'),
    'clicks_como_llegar', count(*) filter (where tipo = 'click_como_llegar'),
    'reservas', count(*) filter (where tipo = 'reserva'),
    'recomendaciones', count(*) filter (where tipo = 'recomendacion'),
    'impresiones_anuncio', count(*) filter (where tipo = 'impresion_anuncio'),
    'clicks_anuncio', count(*) filter (where tipo = 'click_anuncio'),
    'seguidores', (select count(*) from public.seguidores where local_id = local),
    'nuevos_seguidores', (select count(*) from public.seguidores where local_id = local and created_at between desde and hasta),
    'rating', (select coalesce(round(avg(estrellas)::numeric, 1), 0) from public.resenas where local_id = local and not oculta),
    'cantidad_resenas', (select count(*) from public.resenas where local_id = local and not oculta)
  )
  from public.events
  where local_id = local and created_at between desde and hasta
$$;

-- Sumar o restar puntos de forma atómica (no permite saldo negativo)
create function public.mover_puntos(usuario uuid, cantidad integer)
returns integer language plpgsql set search_path = '' as $$
declare saldo integer;
begin
  update public.profiles set puntos = puntos + cantidad
  where id = usuario and puntos + cantidad >= 0
  returning puntos into saldo;
  if saldo is null then raise exception 'puntos_insuficientes'; end if;
  return saldo;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'senales_locales()',
    'metricas_admin(timestamptz, timestamptz)',
    'serie_eventos(timestamptz, timestamptz, text)',
    'activos_por_dia(timestamptz, timestamptz)',
    'ranking_locales(timestamptz, timestamptz)',
    'metricas_local(text, timestamptz, timestamptz)',
    'mover_puntos(uuid, integer)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
