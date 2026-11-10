'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck, LayoutDashboard, Megaphone, Sparkles, Star, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/clientes', label: 'Resumen', icono: LayoutDashboard },
  { href: '/clientes/ficha', label: 'Mi ficha', icono: Store },
  { href: '/clientes/publicaciones', label: 'Publicaciones', icono: Megaphone },
  { href: '/clientes/reservas', label: 'Reservas', icono: CalendarCheck },
  { href: '/clientes/resenas', label: 'Reseñas', icono: Star },
  { href: '/clientes/patrocinio', label: 'Patrocinio', icono: Sparkles },
]

function activo(ruta: string, href: string) {
  return href === '/clientes' ? ruta === '/clientes' : ruta.startsWith(href)
}

/** Links del panel de negocio. Se reutiliza en la barra lateral de compu y en el menú del celu. */
export function NavNegocio({ alNavegar }: { alNavegar?: () => void }) {
  const ruta = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icono: Icono }) => (
        <Link
          key={href}
          href={href}
          onClick={alNavegar}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground',
            activo(ruta, href) && 'bg-rosa-claro text-bordo',
          )}
        >
          <Icono className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
