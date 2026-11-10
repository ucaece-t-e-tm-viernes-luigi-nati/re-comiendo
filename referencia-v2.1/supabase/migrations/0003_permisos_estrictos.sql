-- Supabase da todos los privilegios a anon/authenticated sobre las tablas nuevas por defecto.
-- Los sacamos y dejamos sólo lo necesario: así un usuario no puede, por ejemplo, cambiarse el rol
-- o sumarse puntos editando su perfil (las columnas sensibles sólo las escribe el back end).
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select on public.locales, public.publicaciones, public.resenas, public.premios, public.patrocinios to anon, authenticated;
grant select on public.profiles, public.seguidores, public.favoritos, public.reservas, public.canjes, public.suscripciones to authenticated;
grant insert, delete on public.seguidores, public.favoritos to authenticated;
grant insert, update, delete on public.publicaciones to authenticated;
grant insert on public.resenas to authenticated;
grant update (respuesta) on public.resenas to authenticated;
grant update (nombre, categorias, precio, modo, onboarding_ok, aprendizaje) on public.profiles to authenticated;
grant update (nombre, barrio, direccion, lat, lng, precio, momentos, tags, platos, descripcion, instagram, horarios, fotos) on public.locales to authenticated;
grant update (estado) on public.reservas to authenticated;
