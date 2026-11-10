import { Badge } from '@/components/ui/badge'
import type { EstadoLocal } from '@/lib/tipos'

const INFO: Record<EstadoLocal, { texto: string; variante: 'default' | 'destructive' | 'outline' }> = {
  pendiente: { texto: 'Pendiente de aprobación', variante: 'outline' },
  activo: { texto: 'Activo', variante: 'default' },
  suspendido: { texto: 'Suspendido', variante: 'destructive' },
}

export function EstadoBadge({ estado, className }: { estado: EstadoLocal; className?: string }) {
  const info = INFO[estado]
  return (
    <Badge variant={info.variante} className={className}>
      {info.texto}
    </Badge>
  )
}
