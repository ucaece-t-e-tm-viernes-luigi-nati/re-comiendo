import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Estrellas({ valor, className }: { valor: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('size-3.5', n <= Math.round(valor) ? 'fill-durazno text-durazno' : 'text-muted-foreground/40')} />
      ))}
    </span>
  )
}
