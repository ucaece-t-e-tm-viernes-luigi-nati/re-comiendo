'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Local } from '@/lib/tipos'
import { EstadoBadge } from './estado-badge'
import { NavNegocio } from './nav'

/** Menú del panel de negocio para mobile: botón hamburguesa + Sheet con la navegación. */
export function MenuMovil({ local }: { local: Local }) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Menu className="size-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col gap-4 p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={26} height={26} className="rounded-lg" />
            ReComiendo para negocios
          </SheetTitle>
          <SheetDescription>{local.nombre}</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <EstadoBadge estado={local.estado} />
          {local.estado === 'pendiente' && (
            <p className="mt-2 text-xs text-muted-foreground">Tu local está esperando aprobación.</p>
          )}
        </div>
        <div className="px-2">
          <NavNegocio alNavegar={cerrar} />
        </div>
        <div className="mt-auto space-y-1 border-t p-2">
          <Link
            href={`/local/${local.id}`}
            target="_blank"
            onClick={cerrar}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            Ver mi ficha pública
          </Link>
          <Link
            href="/inicio"
            onClick={cerrar}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Volver a la app
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
