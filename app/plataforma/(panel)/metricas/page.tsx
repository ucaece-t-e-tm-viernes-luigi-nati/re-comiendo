import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requireSuperadmin } from '@/lib/guards'
import { activosPorDia, kpisAdmin, rangoDesdeDias, rankingLocales, serieEventos } from '@/lib/services/metricas'
import { EMOJI_CATEGORIA, NOMBRE_CATEGORIA, type Categoria } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { Kpi, SeccionDashboard } from '../_componentes/kpi'
import { numero, porcentaje, usd } from '../_componentes/formato'
import { GraficoActivos, GraficoEventos, GraficoPremium } from '../_componentes/graficos'

const RANGOS = [7, 30, 60] as const

export default async function PaginaAdmin({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  await requireSuperadmin()
  const { dias: diasParam } = await searchParams
  const dias = (RANGOS as readonly number[]).includes(Number(diasParam)) ? Number(diasParam) : 30
  const rango = rangoDesdeDias(dias)

  const [kpis, activos, eventos, ranking] = await Promise.all([
    kpisAdmin(rango),
    activosPorDia(rango),
    serieEventos(rango),
    rankingLocales(rango, 10),
  ])

  const activosOrdenados = activos.slice().sort((a, b) => a.dia.localeCompare(b.dia))
  const eventosOrdenados = eventos
    .slice()
    .sort((a, b) => String(a.dia).localeCompare(String(b.dia)))
    .map((e) => ({
      dia: String(e.dia),
      view_local: Number(e.view_local ?? 0),
      clicks: Number(e.click_instagram ?? 0) + Number(e.click_como_llegar ?? 0),
      reserva: Number(e.reserva ?? 0),
      compra_premium: Number(e.compra_premium ?? 0),
    }))

  const conversion = kpis.usuarios_totales > 0 ? kpis.premium_total / kpis.usuarios_totales : 0
  const ctrAnuncios = kpis.impresiones_anuncios > 0 ? kpis.clicks_anuncios / kpis.impresiones_anuncios : 0

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-3xl text-bordo">Dashboard</h1>
        <div className="flex gap-2">
          {RANGOS.map((d) => (
            <Link
              key={d}
              href={`/plataforma/metricas?dias=${d}`}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                dias === d ? 'border-bordo bg-bordo text-crema' : 'bg-card hover:border-bordo/40',
              )}
            >
              {d} días
            </Link>
          ))}
        </div>
      </div>

      <SeccionDashboard titulo="Alcance">
        <Kpi titulo="Usuarios totales" valor={numero(kpis.usuarios_totales)} />
        <Kpi titulo="Nuevos en el período" valor={numero(kpis.usuarios_nuevos)} descripcion={`Últimos ${dias} días`} />
        <Kpi titulo="Activos en el período" valor={numero(kpis.usuarios_activos)} descripcion={`Últimos ${dias} días`} />
        <Kpi titulo="Activos hoy" valor={numero(kpis.activos_hoy)} />
      </SeccionDashboard>

      <SeccionDashboard titulo="Negocios">
        <Kpi titulo="Locales activos" valor={numero(kpis.locales_activos)} />
        <Kpi
          titulo="Pendientes de aprobación"
          valor={numero(kpis.locales_pendientes)}
          descripcion="Tocá para revisarlos"
          href="/plataforma/locales"
        />
        <Kpi titulo="Suspendidos" valor={numero(kpis.locales_suspendidos)} />
      </SeccionDashboard>

      <SeccionDashboard titulo="Monetización">
        <Kpi titulo="Usuarios Premium" valor={numero(kpis.premium_total)} />
        <Kpi titulo="Conversión a Premium" valor={porcentaje(conversion)} descripcion="free → Premium" />
        <Kpi titulo="Nuevos Premium" valor={numero(kpis.premium_nuevos)} descripcion={`Últimos ${dias} días`} />
        <Kpi titulo="MRR" valor={usd(kpis.mrr_usd)} descripcion="Mensual recurrente" />
        <Kpi
          titulo="Patrocinios activos"
          valor={numero(kpis.patrocinios_activos)}
          descripcion={`Generan ${usd(kpis.ingresos_patrocinios_usd)}`}
        />
        <Kpi titulo="CTR de anuncios" valor={porcentaje(ctrAnuncios)} descripcion="Clicks / impresiones" />
      </SeccionDashboard>

      <SeccionDashboard titulo="Interacción">
        <Kpi titulo="Vistas" valor={numero(kpis.vistas)} />
        <Kpi titulo="Clicks" valor={numero(kpis.clicks)} />
        <Kpi titulo="Reservas" valor={numero(kpis.reservas)} />
        <Kpi titulo="Reseñas" valor={numero(kpis.resenas)} />
        <Kpi titulo="Canjes" valor={numero(kpis.canjes)} />
      </SeccionDashboard>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
          <h3 className="mb-2 text-sm font-bold text-bordo-osc">Usuarios activos y nuevos por día</h3>
          <GraficoActivos datos={activosOrdenados} />
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
          <h3 className="mb-2 text-sm font-bold text-bordo-osc">Vistas, clicks y reservas por día</h3>
          <GraficoEventos datos={eventosOrdenados} />
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5 md:col-span-2">
          <h3 className="mb-2 text-sm font-bold text-bordo-osc">Compras Premium por día</h3>
          <GraficoPremium datos={eventosOrdenados} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="titulo text-xl text-bordo-osc">Ranking de locales</h2>
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Vistas</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Reservas</TableHead>
                <TableHead className="text-right">Seguidores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((r) => (
                <TableRow key={r.local_id}>
                  <TableCell>
                    <Link href={`/local/${r.local_id}`} className="font-medium hover:text-bordo">
                      {EMOJI_CATEGORIA[r.categoria as Categoria]} {r.nombre}
                    </Link>
                    <span className="ml-1.5 text-xs text-muted-foreground">{NOMBRE_CATEGORIA[r.categoria as Categoria]}</span>
                  </TableCell>
                  <TableCell className="text-right">{numero(r.vistas)}</TableCell>
                  <TableCell className="text-right">{numero(r.clicks)}</TableCell>
                  <TableCell className="text-right">{numero(r.reservas)}</TableCell>
                  <TableCell className="text-right">{numero(r.seguidores)}</TableCell>
                </TableRow>
              ))}
              {ranking.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Todavía no hay datos en este período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
