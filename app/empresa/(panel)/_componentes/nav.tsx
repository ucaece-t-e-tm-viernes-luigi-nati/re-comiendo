'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck, CreditCard, KeyRound, LayoutDashboard, Megaphone, Sparkles, Star, Store, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONOS = {
  resumen: LayoutDashboard,
  ficha: Store,
  publicaciones: Megaphone,
  reservas: CalendarCheck,
  resenas: Star,
  patrocinio: Sparkles,
  equipo: Users,
  plan: CreditCard,
  clave: KeyRound,
} as const

export type ItemNav = { href: string; label: string; icono: keyof typeof ICONOS }

function activo(ruta: string, href: string) {
  return href === '/empresa' ? ruta === '/empresa' : ruta.startsWith(href)
}

/**
 * Links del panel del local. Los items llegan ya filtrados por permiso desde el servidor (layout).
 * Se reutiliza en la barra lateral de compu y en el menú del celu.
 */
export function NavNegocio({ items, alNavegar }: { items: ItemNav[]; alNavegar?: () => void }) {
  const ruta = usePathname()
  return (
    <nav aria-label="Secciones del panel" className="flex flex-col gap-1">
      {items.map(({ href, label, icono }) => {
        const Icono = ICONOS[icono]
        return (
          <Link
            key={href}
            href={href}
            onClick={alNavegar}
            aria-current={activo(ruta, href) ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground',
              activo(ruta, href) && 'bg-rosa-claro text-bordo',
            )}
          >
            <Icono className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
