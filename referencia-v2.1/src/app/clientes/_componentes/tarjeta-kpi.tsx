import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function TarjetaKpi({
  titulo,
  valor,
  subtitulo,
  icono: Icono,
  className,
}: {
  titulo: string
  valor: string | number
  subtitulo?: string
  icono: LucideIcon
  className?: string
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{titulo}</p>
          <p className="text-xl font-bold text-bordo-osc">{valor}</p>
          {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
        </div>
        <Icono className="size-4 shrink-0 text-bordo/60" />
      </CardContent>
    </Card>
  )
}
