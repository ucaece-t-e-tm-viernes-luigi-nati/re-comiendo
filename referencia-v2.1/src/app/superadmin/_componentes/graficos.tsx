'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { diaCorto } from './formato'

const configActivos: ChartConfig = {
  activos: { label: 'Activos', color: 'var(--chart-1)' },
  nuevos: { label: 'Nuevos', color: 'var(--chart-4)' },
}

export function GraficoActivos({ datos }: { datos: { dia: string; activos: number; nuevos: number }[] }) {
  return (
    <ChartContainer config={configActivos} className="aspect-auto h-64 w-full">
      <AreaChart data={datos} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={diaCorto} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => diaCorto(String(v))} />} />
        <Area dataKey="activos" type="monotone" fill="var(--color-activos)" fillOpacity={0.2} stroke="var(--color-activos)" strokeWidth={2} />
        <Area dataKey="nuevos" type="monotone" fill="var(--color-nuevos)" fillOpacity={0.3} stroke="var(--color-nuevos)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  )
}

const configEventos: ChartConfig = {
  view_local: { label: 'Vistas', color: 'var(--chart-1)' },
  clicks: { label: 'Clicks', color: 'var(--chart-2)' },
  reserva: { label: 'Reservas', color: 'var(--chart-5)' },
}

export function GraficoEventos({ datos }: { datos: { dia: string; view_local: number; clicks: number; reserva: number }[] }) {
  return (
    <ChartContainer config={configEventos} className="aspect-auto h-64 w-full">
      <LineChart data={datos} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={diaCorto} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => diaCorto(String(v))} />} />
        <Line dataKey="view_local" type="monotone" stroke="var(--color-view_local)" strokeWidth={2} dot={false} />
        <Line dataKey="clicks" type="monotone" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
        <Line dataKey="reserva" type="monotone" stroke="var(--color-reserva)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  )
}

const configPremium: ChartConfig = {
  compra_premium: { label: 'Compras Premium', color: 'var(--chart-3)' },
}

export function GraficoPremium({ datos }: { datos: { dia: string; compra_premium: number }[] }) {
  return (
    <ChartContainer config={configPremium} className="aspect-auto h-64 w-full">
      <BarChart data={datos} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={diaCorto} />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => diaCorto(String(v))} />} />
        <Bar dataKey="compra_premium" fill="var(--color-compra_premium)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
