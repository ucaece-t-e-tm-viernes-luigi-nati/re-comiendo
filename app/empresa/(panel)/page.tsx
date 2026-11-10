import Link from 'next/link'
import { AtSign, CalendarCheck, Eye, Heart, MapPin, Megaphone, Sparkles, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireLocalConFicha } from '@/lib/guards'
import { kpisLocal, rangoDesdeDias, serieEventos } from '@/lib/services/metricas'
import { cn } from '@/lib/utils'
import { GraficoResumen } from './_componentes/grafico-resumen'
import { TarjetaKpi } from './_componentes/tarjeta-kpi'

const RANGOS = [7, 30, 60] as const

export default async function PaginaResumen({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { local } = await requireLocalConFicha('dashboard.view')

  const sp = await searchParams
  const diasParam = Number(Array.isArray(sp.dias) ? sp.dias[0] : sp.dias)
  const dias = (RANGOS as readonly number[]).includes(diasParam) ? diasParam : 30
  const rango = rangoDesdeDias(dias)

  const [kpis, serie] = await Promise.all([kpisLocal(local.id, rango), serieEventos(rango, local.id)])
  const ctr = kpis.impresiones_anuncio > 0 ? (kpis.clicks_anuncio / kpis.impresiones_anuncio) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-2xl text-bordo-osc">Resumen</h1>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {RANGOS.map((d) => (
            <Link
              key={d}
              href={`/empresa?dias=${d}`}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition',
                d === dias ? 'bg-white text-bordo shadow-sm' : 'text-muted-foreground',
              )}
            >
              {d} días
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <TarjetaKpi titulo="Vistas" valor={kpis.vistas} icono={Eye} />
        <TarjetaKpi titulo="Clicks a Instagram" valor={kpis.clicks_instagram} icono={AtSign} />
        <TarjetaKpi titulo="Clicks a Cómo llegar" valor={kpis.clicks_como_llegar} icono={MapPin} />
        <TarjetaKpi titulo="Reservas" valor={kpis.reservas} icono={CalendarCheck} />
        <TarjetaKpi titulo="Seguidores" valor={kpis.seguidores} subtitulo={`+${kpis.nuevos_seguidores} nuevos`} icono={Heart} />
        <TarjetaKpi titulo="Rating" valor={kpis.rating.toFixed(1)} subtitulo={`${kpis.cantidad_resenas} reseñas`} icono={Star} />
        <TarjetaKpi titulo="En recomendaciones" valor={kpis.recomendaciones} icono={Sparkles} />
        <TarjetaKpi
          titulo="Anuncio"
          valor={`${kpis.impresiones_anuncio} imp.`}
          subtitulo={`${kpis.clicks_anuncio} clicks · CTR ${ctr.toFixed(1)}%`}
          icono={Megaphone}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad diaria</CardTitle>
        </CardHeader>
        <CardContent>
          <GraficoResumen datos={serie} />
        </CardContent>
      </Card>
    </div>
  )
}
