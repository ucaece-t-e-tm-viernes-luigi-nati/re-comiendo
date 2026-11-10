import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FotoLocal } from '@/components/comunes/tarjeta-local'
import { requerirRol } from '@/lib/services/auth'
import { feed } from '@/lib/services/usuarios'

export const metadata = { title: 'Eventos' }

/** Promos y novedades que publican los locales (todos, no sólo los que seguís). */
export default async function PaginaEventos() {
  await requerirRol()
  const { items } = await feed(null)
  const hoy = new Date().toISOString().slice(0, 10)
  const pubs = items
    .flatMap((i) => (i.tipo === 'publicacion' ? [i] : []))
    .filter((i) => !i.publicacion.vence || i.publicacion.vence >= hoy)
    .sort((a, b) => Number(b.publicacion.tipo === 'promo') - Number(a.publicacion.tipo === 'promo'))

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div>
        <h1 className="titulo text-3xl text-bordo">Eventos y promos</h1>
        <p className="text-sm text-muted-foreground">Lo que están armando los locales de Mar del Plata.</p>
      </div>
      {pubs.map(({ publicacion: p, local }) => (
        <article key={p.id} className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/5">
          <Link href={`/local/${local.id}`} className="flex items-center gap-3 px-4 py-3">
            <FotoLocal local={local} className="size-9 rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{local.nombre}</p>
              <p className="text-xs text-muted-foreground">{local.barrio}</p>
            </div>
            {p.tipo === 'promo' ? <Badge className="bg-durazno text-bordo-osc">Promo</Badge> : <Badge variant="outline">Novedad</Badge>}
          </Link>
          {p.foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.foto} alt="" className="aspect-video w-full object-cover" loading="lazy" />
          )}
          <div className="flex flex-col gap-2 px-4 py-3 text-sm">
            <p>{p.texto}</p>
            {p.vence && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" /> Hasta el {new Date(p.vence + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
        </article>
      ))}
      {pubs.length === 0 && <p className="rounded-2xl bg-suave px-4 py-6 text-center text-sm">Todavía no hay eventos ni promos cargados.</p>}
    </div>
  )
}
