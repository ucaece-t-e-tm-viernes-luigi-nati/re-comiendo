import Link from 'next/link'
import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FotoLocal } from '@/components/comunes/tarjeta-local'
import { requerirRol } from '@/lib/services/auth'
import { feed } from '@/lib/services/usuarios'

export const metadata = { title: 'Feed' }

function haceCuanto(fecha: string) {
  const h = Math.floor((Date.now() - new Date(fecha).getTime()) / 3600000)
  if (h < 1) return 'recién'
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export default async function PaginaFeed() {
  const perfil = await requerirRol()
  const { items, sigueAlguno } = await feed(perfil.id)
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="titulo text-3xl text-bordo">Feed</h1>
      {!sigueAlguno && (
        <p className="rounded-2xl bg-suave px-4 py-3 text-sm">
          Todavía no seguís a ningún lugar: te mostramos lo último de toda la comunidad. Tocá <b>Seguir</b> en la ficha de un local para ver
          sus novedades acá.
        </p>
      )}
      {items.map((item) => {
        const foto = item.tipo === 'publicacion' ? item.publicacion.foto : item.resena.foto
        return (
          <article key={item.tipo + (item.tipo === 'publicacion' ? item.publicacion.id : item.resena.id)} className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/5">
            <Link href={`/local/${item.local.id}`} className="flex items-center gap-3 px-4 py-3">
              <FotoLocal local={item.local} className="size-9 rounded-full" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{item.local.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {item.tipo === 'resena' ? `Reseña de ${item.resena.autor}` : item.local.barrio} · {haceCuanto(item.fecha)}
                </p>
              </div>
              {item.tipo === 'publicacion' && item.publicacion.tipo === 'promo' && <Badge className="bg-durazno text-bordo-osc">Promo</Badge>}
            </Link>
            {foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="" className="aspect-square w-full object-cover" loading="lazy" />
            )}
            <div className="px-4 py-3 text-sm">
              {item.tipo === 'resena' && (
                <p className="mb-1 flex items-center gap-0.5">
                  {Array.from({ length: item.resena.estrellas }, (_, i) => (
                    <Star key={i} className="size-3.5 fill-durazno text-durazno" />
                  ))}
                </p>
              )}
              <p>{item.tipo === 'publicacion' ? item.publicacion.texto : item.resena.texto}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
