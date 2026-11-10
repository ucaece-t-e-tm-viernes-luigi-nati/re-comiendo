import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Tarjeta de KPI: número grande + descripción corta. Si tiene href, es clickeable. */
export function Kpi({
  titulo,
  valor,
  descripcion,
  href,
  className,
}: {
  titulo: string
  valor: string
  descripcion?: string
  href?: string
  className?: string
}) {
  const contenido = (
    <Card className={cn('h-full gap-1', className)}>
      <CardContent className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
        <p className="titulo text-2xl text-bordo md:text-3xl">{valor}</p>
        {descripcion && <p className="text-xs text-muted-foreground">{descripcion}</p>}
      </CardContent>
    </Card>
  )
  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-80">
        {contenido}
      </Link>
    )
  }
  return contenido
}

/** Título de sección con separador visual, reutilizado en todo el dashboard. */
export function SeccionDashboard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="titulo text-xl text-bordo-osc">{titulo}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{children}</div>
    </section>
  )
}
