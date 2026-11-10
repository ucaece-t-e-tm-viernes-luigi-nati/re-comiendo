'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { NavNegocio, type ItemNav } from './nav'

/** Menú del panel del local para mobile: botón hamburguesa + Sheet con la navegación. */
export function MenuMovil({ nombre, localId, items }: { nombre: string; localId: string | null; items: ItemNav[] }) {
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
            ReComiendo para locales
          </SheetTitle>
          <SheetDescription>{nombre}</SheetDescription>
        </SheetHeader>
        <div className="px-2">
          <NavNegocio items={items} alNavegar={cerrar} />
        </div>
        {localId && (
          <div className="mt-auto border-t p-2">
            <Link
              href={`/local/${localId}`}
              target="_blank"
              onClick={cerrar}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <ExternalLink className="size-4" />
              Ver mi ficha pública
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
