import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requerirRol } from '@/lib/services/auth'
import { miLocal } from '@/lib/services/negocios'
import { EstadoBadge } from './_componentes/estado-badge'
import { MenuMovil } from './_componentes/menu-movil'
import { NavNegocio } from './_componentes/nav'

export default async function LayoutNegocio({ children }: { children: ReactNode }) {
  const perfil = await requerirRol('negocio')
  const local = await miLocal(perfil)
  if (!local) redirect('/negocios')
  if (local.estado !== 'activo') return <EnEspera nombre={local.nombre} pendiente={local.estado === 'pendiente'} />

  return (
    <div className="flex min-h-dvh bg-crema">
      <aside className="hidden w-64 shrink-0 flex-col gap-5 border-r bg-white p-5 md:flex">
        <Link href="/clientes" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={30} height={30} className="rounded-lg" />
          <span className="titulo text-base leading-tight text-bordo-osc">
            ReComiendo
            <br />
            <span className="text-xs font-normal text-muted-foreground">para negocios</span>
          </span>
        </Link>

        <div className="space-y-2 rounded-xl bg-suave p-3">
          <p className="truncate text-sm font-bold text-bordo-osc">{local.nombre}</p>
          <EstadoBadge estado={local.estado} />
        </div>

        <NavNegocio />

        <div className="mt-auto space-y-1 border-t pt-3">
          <Link
            href={`/local/${local.id}`}
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-4" />
            Ver mi ficha pública
          </Link>
          <Link
            href="/inicio"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a la app
          </Link>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-[1000] flex items-center justify-between gap-3 border-b bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <MenuMovil local={local} />
            <Link href="/clientes" className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={26} height={26} className="rounded-lg" />
              <span className="titulo text-base text-bordo-osc">ReComiendo</span>
            </Link>
          </div>
          <EstadoBadge estado={local.estado} className="shrink-0" />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}

/** Lo que ve el negocio mientras su solicitud no está aprobada (o si el local fue dado de baja). */
function EnEspera({ nombre, pendiente }: { nombre: string; pendiente: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bordo-osc px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-crema p-8 text-center shadow-xl">
        <Image src="/logo.png" alt="" width={44} height={44} className="rounded-xl" />
        <span className="flex size-14 items-center justify-center rounded-full bg-durazno text-bordo-osc">
          <Clock className="size-7" />
        </span>
        <h1 className="titulo text-2xl text-bordo">{pendiente ? 'Estamos revisando tu solicitud' : 'Tu local no está habilitado'}</h1>
        <p className="text-muted-foreground">
          {pendiente ? (
            <>
              Recibimos los datos de <b className="text-foreground">{nombre}</b>. Te contestamos dentro de las{' '}
              <b className="text-foreground">48 horas</b>. Cuando lo aprobemos, desde acá vas a poder gestionar tu local.
            </>
          ) : (
            <>
              <b className="text-foreground">{nombre}</b> no está activo en ReComiendo. Si creés que es un error, escribinos y lo revisamos.
            </>
          )}
        </p>
        <Button asChild variant="outline">
          <Link href="/">Volver a ReComiendo</Link>
        </Button>
      </div>
    </div>
  )
}
