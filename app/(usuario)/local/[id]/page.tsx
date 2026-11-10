import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AtSign, Camera, Clock, MapPin, MessageSquareReply, Navigation, PenLine, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Estrellas } from '@/components/comunes/estrellas'
import { Mapa } from '@/components/comunes/mapa'
import { EnlaceRastreado, RegistrarEvento } from '@/components/comunes/rastreo'
import { obtenerPerfil } from '@/lib/services/auth'
import {
  obtenerLocal,
  obtenerSeñales,
  patrocinadosActivos,
  publicacionesDeLocal,
  resenasDeLocal,
  turnosDisponibles,
} from '@/lib/services/locales'
import { relacionCon } from '@/lib/services/usuarios'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, PRECIO_TEXTO } from '@/lib/tipos'
import { BotonesSociales, Reservar } from './acciones-local'

export async function generateMetadata({ params }: PageProps<'/local/[id]'>) {
  const local = await obtenerLocal((await params).id)
  return { title: local?.nombre ?? 'Local' }
}

function haceCuanto(fecha: string) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default async function PaginaLocal({ params, searchParams }: PageProps<'/local/[id]'>) {
  const { id } = await params
  const { anuncio } = await searchParams
  const local = await obtenerLocal(id)
  if (!local) notFound()

  const perfil = await obtenerPerfil()
  const [señales, resenas, publicaciones, turnos, patrocinios, relacion] = await Promise.all([
    obtenerSeñales(),
    resenasDeLocal(id),
    publicacionesDeLocal(id),
    turnosDisponibles(id),
    patrocinadosActivos(),
    perfil ? relacionCon(perfil.id, id) : Promise.resolve({ sigue: false, favorito: false }),
  ])
  const s = señales[id]
  const promo = patrocinios.find((p) => p.local_id === id)
  const comoLlegar =
    local.lat != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${local.nombre} ${local.direccion} Mar del Plata`)}`
  const ig = local.instagram.replace(/^@/, '')
  const yaReseño = perfil && resenas.some((r) => r.user_id === perfil.id)
  const menu = publicaciones.filter((p) => p.tipo === 'menu')
  const posteos = publicaciones.filter((p) => p.tipo !== 'menu')

  return (
    <div className="flex flex-col gap-6">
      <RegistrarEvento tipo="view_local" localId={id} />
      {anuncio === '1' && <RegistrarEvento tipo="click_anuncio" localId={id} />}
      {local.estado !== 'activo' && (
        <p className="rounded-xl bg-orange-100 px-4 py-2 text-sm text-orange-900">
          Este local está {local.estado === 'pendiente' ? 'esperando aprobación' : 'suspendido'} y no aparece en la app.
        </p>
      )}

      {/* Fotos */}
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:px-0">
        {(local.fotos.length ? local.fotos : ['']).map((f, i) =>
          f ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f + i} src={f} alt={`${local.nombre} ${i + 1}`} className="aspect-[4/3] w-[85%] shrink-0 snap-center rounded-3xl object-cover md:w-full" />
          ) : (
            <div key={i} className="aspect-[4/3] w-full rounded-3xl bg-bordo" />
          ),
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          {/* Encabezado */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="titulo text-4xl text-bordo">{local.nombre}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {EMOJI_CATEGORIA[local.categoria]} {NOMBRE_CATEGORIA[local.categoria]} · {PRECIO_TEXTO[local.precio]} · {local.barrio}
                </p>
                {s && s.cantidadResenas > 0 && (
                  <p className="mt-1 flex items-center gap-2 text-sm">
                    <Estrellas valor={s.rating} /> <b>{s.rating.toFixed(1)}</b>
                    <span className="text-muted-foreground">({s.cantidadResenas} reseñas)</span>
                  </p>
                )}
              </div>
              <BotonesSociales localId={id} logueado={!!perfil} sigue={relacion.sigue} favorito={relacion.favorito} />
            </div>
            {promo && (
              <div className="flex items-center gap-2 rounded-xl bg-durazno/30 px-3 py-2 text-sm">
                <Tag className="size-4 text-bordo" />
                <b className="text-bordo-osc">{promo.beneficio}</b>
              </div>
            )}
            <p className="leading-relaxed">{local.descripcion}</p>
            {local.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {local.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="capitalize">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {ig && (
                <Button asChild variant="outline">
                  <EnlaceRastreado href={`https://instagram.com/${ig}`} tipo="click_instagram" localId={id}>
                    <AtSign /> Ver fotos y carta en su Instagram
                  </EnlaceRastreado>
                </Button>
              )}
              <Button asChild variant="outline">
                <EnlaceRastreado href={comoLlegar} tipo="click_como_llegar" localId={id}>
                  <Navigation /> Cómo llegar
                </EnlaceRastreado>
              </Button>
            </div>
          </section>

          {/* Lo más pedido */}
          {local.platos.length > 0 && (
            <section>
              <h2 className="titulo mb-2 text-2xl">Lo más pedido</h2>
              <ul className="grid gap-2 sm:grid-cols-3">
                {local.platos.map((p) => (
                  <li key={p} className="rounded-xl bg-card px-3 py-2 text-sm font-medium ring-1 ring-foreground/5">
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Menú que carga el local desde su panel */}
          {menu.length > 0 && (
            <section>
              <h2 className="titulo mb-2 text-2xl">Menú</h2>
              <div className="flex flex-col gap-2">
                {menu.map((p) => (
                  <article key={p.id} className="flex gap-3 overflow-hidden rounded-2xl bg-card p-3 ring-1 ring-foreground/5">
                    {p.foto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto} alt="" className="size-20 shrink-0 rounded-xl object-cover" loading="lazy" />
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-line">{p.texto}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Publicaciones (estilo Instagram) */}
          {posteos.length > 0 && (
            <section>
              <h2 className="titulo mb-2 text-2xl">Publicaciones</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {posteos.map((p) => (
                  <article key={p.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
                    {p.foto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                    )}
                    <div className="p-2.5">
                      {p.tipo === 'promo' && <Badge className="mb-1 bg-durazno text-bordo-osc">Promo</Badge>}
                      <p className="text-sm leading-snug">{p.texto}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{haceCuanto(p.created_at)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Reseñas */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="titulo text-2xl">Reseñas</h2>
              {!yaReseño && (
                <Button asChild size="sm" variant="secondary">
                  <Link href={perfil ? `/local/${id}/resena` : `/ingresar?volver=/local/${id}/resena`}>
                    <PenLine /> Ya fui · reseñar
                  </Link>
                </Button>
              )}
            </div>
            {resenas.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay reseñas. ¡Contale a la comunidad!</p>}
            {resenas.map((r) => (
              <article key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
                <div className="flex items-center justify-between">
                  <b className="text-sm">{r.autor}</b>
                  <span className="text-xs text-muted-foreground">{haceCuanto(r.created_at)}</span>
                </div>
                <Estrellas valor={r.estrellas} className="mt-1" />
                {r.texto && <p className="mt-2 text-sm leading-relaxed">{r.texto}</p>}
                {r.etiquetas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.etiquetas.map((e) => (
                      <Badge key={e} variant="outline">
                        {e}
                      </Badge>
                    ))}
                  </div>
                )}
                {r.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.foto} alt="Foto de la reseña" className="mt-3 h-40 rounded-xl object-cover" loading="lazy" />
                )}
                {r.respuesta && (
                  <div className="mt-3 flex gap-2 rounded-xl bg-suave px-3 py-2 text-sm">
                    <MessageSquareReply className="mt-0.5 size-4 shrink-0 text-bordo" />
                    <p>
                      <b className="text-bordo">Respuesta del local:</b> {r.respuesta}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </section>
        </div>

        {/* Columna lateral */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20 md:self-start">
          <Reservar localId={id} nombre={local.nombre} turnos={turnos} logueado={!!perfil} premium={!!perfil?.es_premium} />
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
            {local.lat != null && local.lng != null && (
              <Mapa
                className="h-48 w-full"
                conPopup={false}
                puntos={[{ id, nombre: local.nombre, categoria: local.categoria, lat: local.lat, lng: local.lng, barrio: local.barrio }]}
              />
            )}
            <div className="flex flex-col gap-2 p-4 text-sm">
              <p className="flex gap-2">
                <MapPin className="size-4 shrink-0 text-bordo" /> {local.direccion || local.barrio}
              </p>
              {local.horarios && (
                <p className="flex gap-2">
                  <Clock className="size-4 shrink-0 text-bordo" /> {local.horarios}
                </p>
              )}
              {perfil && !yaReseño && (
                <p className="flex gap-2 text-muted-foreground">
                  <Camera className="size-4 shrink-0 text-bordo" /> Reseñá con foto y sumá puntos.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
