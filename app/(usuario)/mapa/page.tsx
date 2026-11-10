import Link from 'next/link'
import { BotonUbicacion } from '@/components/comunes/boton-ubicacion'
import { Mapa } from '@/components/comunes/mapa'
import { listarLocales, obtenerSeñales, patrocinadosActivos } from '@/lib/services/locales'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, type Categoria } from '@/lib/tipos'
import { ubicacionGuardada } from '@/lib/ubicacion'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Mapa' }

export default async function PaginaMapa({ searchParams }: PageProps<'/mapa'>) {
  const { categoria: c } = await searchParams
  const categoria = typeof c === 'string' && c in NOMBRE_CATEGORIA ? (c as Categoria) : undefined
  const [locales, señales, patrocinios, yo] = await Promise.all([
    listarLocales({ categoria }),
    obtenerSeñales(),
    patrocinadosActivos(),
    ubicacionGuardada(),
  ])
  const patrocinados = new Set(patrocinios.map((p) => p.local_id))
  const puntos = locales
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({
      id: l.id,
      nombre: l.nombre,
      categoria: l.categoria,
      lat: l.lat!,
      lng: l.lng!,
      barrio: l.barrio,
      foto: l.fotos[0],
      rating: señales[l.id]?.rating,
      patrocinado: patrocinados.has(l.id),
    }))
  const chip = (activo: boolean) =>
    cn('shrink-0 rounded-full border px-3 py-1 text-sm', activo ? 'border-bordo bg-bordo text-crema' : 'bg-card')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="titulo text-3xl text-bordo">Cerca tuyo</h1>
        <BotonUbicacion activa={!!yo} />
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/mapa" className={chip(!categoria)}>
          Todo
        </Link>
        {(Object.keys(NOMBRE_CATEGORIA) as Categoria[]).map((k) => (
          <Link key={k} href={`/mapa?categoria=${k}`} className={chip(categoria === k)}>
            {EMOJI_CATEGORIA[k]} {NOMBRE_CATEGORIA[k]}
          </Link>
        ))}
      </div>
      <div className="h-[calc(100dvh-260px)] min-h-80 overflow-hidden rounded-3xl ring-1 ring-foreground/10">
        <Mapa puntos={puntos} yo={yo} className="h-full w-full" />
      </div>
      <p className="text-xs text-muted-foreground">{puntos.length} lugares en el mapa · los naranjas son patrocinados</p>
    </div>
  )
}
