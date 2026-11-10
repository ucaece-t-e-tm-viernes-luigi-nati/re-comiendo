'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, LayoutDashboard, Menu, Settings, ShieldCheck, Star, Store, Trophy, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/superadmin', label: 'Dashboard', icono: LayoutDashboard },
  { href: '/superadmin/locales', label: 'Locales', icono: Store },
  { href: '/superadmin/usuarios', label: 'Usuarios', icono: Users },
  { href: '/superadmin/resenas', label: 'Reseñas', icono: Star },
  { href: '/superadmin/premios', label: 'Premios', icono: Trophy },
  { href: '/superadmin/ajustes', label: 'Ajustes', icono: Settings },
]

function activo(ruta: string, href: string) {
  return href === '/superadmin' ? ruta === '/superadmin' : ruta.startsWith(href)
}

function Links({ pendientes, onNavegar }: { pendientes: number; onNavegar?: () => void }) {
  const ruta = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icono: Icono }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavegar}
          className={cn(
            'flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-crema/80 transition hover:bg-white/10 hover:text-crema',
            activo(ruta, href) && 'bg-white/15 text-crema',
          )}
        >
          <span className="flex items-center gap-2">
            <Icono className="size-4" />
            {label}
          </span>
          {href === '/superadmin/locales' && pendientes > 0 && (
            <Badge className="bg-durazno text-bordo-osc">{pendientes}</Badge>
          )}
        </Link>
      ))}
      <div className="my-2 h-px bg-white/10" />
      <Link
        href="/inicio"
        onClick={onNavegar}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-crema/70 transition hover:bg-white/10 hover:text-crema"
      >
        <ArrowLeft className="size-4" />
        Volver a la app
      </Link>
    </nav>
  )
}

function Marca() {
  return (
    <div className="flex items-center gap-2 px-1">
      <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
      <span className="titulo text-lg leading-tight text-crema">
        ReComiendo
        <span className="block text-[11px] font-normal tracking-wide text-crema/60">Superadmin</span>
      </span>
    </div>
  )
}

/** Sidebar fija en desktop. */
export function SidebarAdmin({ pendientes }: { pendientes: number }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-5 bg-bordo-osc p-4 md:flex">
      <Marca />
      <Links pendientes={pendientes} />
    </aside>
  )
}

/** Barra superior con menú hamburguesa en mobile. */
export function BarraMobilAdmin({ pendientes }: { pendientes: number }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <header className="sticky top-0 z-[1000] flex items-center justify-between gap-2 bg-bordo-osc px-3 py-2.5 md:hidden">
      <div className="flex items-center gap-2 text-crema">
        <ShieldCheck className="size-5 text-durazno" />
        <span className="titulo text-base">ReComiendo · Superadmin</span>
      </div>
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-crema hover:bg-white/10 hover:text-crema">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-bordo-osc p-4 text-crema [&_[data-slot=sheet-close]]:text-crema">
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only text-crema">Menú de superadmin</SheetTitle>
            <Marca />
          </SheetHeader>
          <div className="mt-5">
            <Links pendientes={pendientes} onNavegar={() => setAbierto(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
