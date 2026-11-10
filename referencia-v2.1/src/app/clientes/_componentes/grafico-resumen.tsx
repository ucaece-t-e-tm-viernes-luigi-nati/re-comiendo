'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const CONFIG: ChartConfig = {
  vistas: { label: 'Vistas', color: 'var(--chart-1)' },
  clicks: { label: 'Clicks', color: 'var(--chart-2)' },
  reservas: { label: 'Reservas', color: 'var(--chart-3)' },
}

/** Línea/área diaria de vistas, clicks (instagram + cómo llegar) y reservas. */
export function GraficoResumen({ datos }: { datos: Record<string, number | string>[] }) {
  const puntos = datos.map((d) => ({
    dia: new Date(String(d.dia)).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    vistas: Number(d.view_local ?? 0),
    clicks: Number(d.click_instagram ?? 0) + Number(d.click_como_llegar ?? 0),
    reservas: Number(d.reserva ?? 0),
  }))

  return (
    <ChartContainer config={CONFIG} className="aspect-auto h-64 w-full">
      <AreaChart data={puntos} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area dataKey="vistas" type="monotone" fill="var(--color-vistas)" fillOpacity={0.15} stroke="var(--color-vistas)" strokeWidth={2} />
        <Area dataKey="clicks" type="monotone" fill="var(--color-clicks)" fillOpacity={0.15} stroke="var(--color-clicks)" strokeWidth={2} />
        <Area dataKey="reservas" type="monotone" fill="var(--color-reservas)" fillOpacity={0.15} stroke="var(--color-reservas)" strokeWidth={2} />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
