'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { CalendarDays, Coins, Compass, Crown, Home, Map, Menu, Newspaper, Sparkles, User } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const PRINCIPALES = [
  { href: '/inicio', label: 'Inicio', icono: Home },
  { href: '/eventos', label: 'Eventos', icono: CalendarDays },
  { href: '/refi', label: 'Refi', icono: Sparkles },
]

const SECUNDARIOS = [
  { href: '/explorar', label: 'Explorar', icono: Compass },
  { href: '/mapa', label: 'Mapa', icono: Map },
  { href: '/feed', label: 'Feed', icono: Newspaper },
  { href: '/perfil', label: 'Perfil', icono: User },
]

const DEL_MENU = [
  ...SECUNDARIOS,
  { href: '/puntos', label: 'Puntos y premios', icono: Coins },
  { href: '/premium', label: 'Premium', icono: Crown },
]

function activo(ruta: string, href: string) {
  return ruta.startsWith(href)
}

/** Abajo en el celu: Inicio / Eventos / Refi / Menú. Arriba en compu: todos los links. */
export function Navegacion({ variante }: { variante: 'abajo' | 'arriba' }) {
  const ruta = usePathname()
  const [abierto, setAbierto] = useState(false)

  if (variante === 'arriba') {
    return (
      <nav className="hidden items-center gap-1 md:flex">
        {[...PRINCIPALES, ...SECUNDARIOS].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium text-crema/80 transition hover:bg-white/10 hover:text-crema',
              activo(ruta, href) && 'bg-white/15 text-crema',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    )
  }

  const extras = DEL_MENU
  const menuActivo = DEL_MENU.some((i) => activo(ruta, i.href))
  const claseItem = 'flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium text-muted-foreground'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md justify-around">
        {PRINCIPALES.map(({ href, label, icono: Icono }) => (
          <li key={href}>
            <Link href={href} className={cn(claseItem, activo(ruta, href) && 'text-bordo')}>
              <Icono className="size-5" strokeWidth={activo(ruta, href) ? 2.4 : 1.8} />
              {label}
            </Link>
          </li>
        ))}
        <li>
          <Sheet open={abierto} onOpenChange={setAbierto}>
            <SheetTrigger asChild>
              <button type="button" className={cn(claseItem, menuActivo && 'text-bordo')}>
                <Menu className="size-5" strokeWidth={menuActivo ? 2.4 : 1.8} />
                Menú
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="z-[1100] rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <SheetHeader>
                <SheetTitle className="titulo text-bordo">Menú</SheetTitle>
              </SheetHeader>
              <ul className="grid grid-cols-3 gap-2 px-4">
                {extras.map(({ href, label, icono: Icono }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setAbierto(false)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl bg-suave px-2 py-3 text-center text-xs font-medium text-bordo-osc',
                        activo(ruta, href) && 'bg-rosa-claro text-bordo ring-1 ring-bordo/30',
                      )}
                    >
                      <Icono className="size-5" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  )
}
