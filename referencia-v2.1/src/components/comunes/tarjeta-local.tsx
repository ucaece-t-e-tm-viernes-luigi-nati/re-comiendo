import Link from 'next/link'
import { MapPin, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Local } from '@/lib/tipos'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, PRECIO_TEXTO } from '@/lib/tipos'
import type { Señales } from '@/lib/services/recomendador'
import { cn } from '@/lib/utils'
import { RegistrarEvento } from './rastreo'

export function FotoLocal({ local, className }: { local: Pick<Local, 'fotos' | 'nombre'>; className?: string }) {
  const foto = local.fotos[0]
  return foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto} alt={local.nombre} className={cn('object-cover', className)} loading="lazy" />
  ) : (
    <div className={cn('bg-bordo', className)} />
  )
}

export function TarjetaLocal({
  local,
  señales,
  motivo,
  match,
  distanciaKm,
  patrocinado,
}: {
  local: Local
  señales?: Señales
  motivo?: string
  match?: number
  distanciaKm?: number | null
  patrocinado?: string
}) {
  return (
    <Link
      href={`/local/${local.id}${patrocinado ? '?anuncio=1' : ''}`}
      className="group flex gap-3 rounded-2xl bg-card p-2.5 ring-1 ring-foreground/5 transition hover:ring-bordo/30"
    >
      {patrocinado && <RegistrarEvento tipo="impresion_anuncio" localId={local.id} />}
      <FotoLocal local={local} className="size-24 shrink-0 rounded-xl sm:size-28" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-bold leading-tight group-hover:text-bordo">{local.nombre}</h3>
          {match ? <span className="shrink-0 rounded-full bg-rosa-claro px-2 py-0.5 text-xs font-bold text-bordo">{match}%</span> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {EMOJI_CATEGORIA[local.categoria]} {NOMBRE_CATEGORIA[local.categoria]} · {PRECIO_TEXTO[local.precio]}
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <MapPin className="size-3" />
            {distanciaKm != null ? `${distanciaKm.toFixed(1)} km` : local.barrio}
          </span>
          {señales && señales.cantidadResenas > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="size-3 fill-durazno text-durazno" />
              {señales.rating.toFixed(1)} ({señales.cantidadResenas})
            </span>
          )}
        </p>
        {patrocinado ? (
          <div className="mt-auto flex items-center gap-1.5">
            <Badge className="bg-durazno text-bordo-osc">Patrocinado</Badge>
            <span className="truncate text-xs font-medium text-bordo">{patrocinado}</span>
          </div>
        ) : (
          motivo && <p className="mt-auto truncate text-xs font-medium text-bordo">{motivo}</p>
        )}
      </div>
    </Link>
  )
}
