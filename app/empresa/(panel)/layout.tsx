import Image from 'next/image'
import Link from 'next/link'
import { CircleAlert, ExternalLink, LogOut } from 'lucide-react'
import { signOutAction } from '@/app/auth-actions'
import { StatusBadge } from '@/components/panel/ui'
import { requireLocal } from '@/lib/guards'
import { localCan } from '@/lib/permissions'
import { MenuMovil } from './_componentes/menu-movil'
import { NavNegocio, type ItemNav } from './_componentes/nav'
import { switchClient } from './actions'

// Guard en el servidor ANTES de responder: sin sesión o sin membresía → 404 (no revela que existe).
export const instant = false

export default async function LayoutPanelLocal({ children }: LayoutProps<'/empresa'>) {
  const ctx = await requireLocal('dashboard.view')
  const puede = (p: Parameters<typeof localCan>[1]) => localCan(ctx.role, p)
  const items: ItemNav[] = [
    { href: '/empresa', label: 'Resumen', icono: 'resumen' },
    ...(puede('local.edit') ? [{ href: '/empresa/ficha', label: 'Mi ficha', icono: 'ficha' } as const] : []),
    { href: '/empresa/publicaciones', label: 'Menú y promos', icono: 'publicaciones' },
    { href: '/empresa/reservas', label: 'Reservas', icono: 'reservas' },
    { href: '/empresa/resenas', label: 'Reseñas', icono: 'resenas' },
    ...(puede('sponsorship.manage') ? [{ href: '/empresa/patrocinio', label: 'Patrocinio', icono: 'patrocinio' } as const] : []),
    { href: '/empresa/equipo', label: 'Equipo', icono: 'equipo' },
    ...(puede('billing.view') ? [{ href: '/empresa/plan', label: 'Plan y pagos', icono: 'plan' } as const] : []),
    { href: '/empresa/cambiar-clave', label: 'Cambiar clave', icono: 'clave' },
  ]
  const nombre = ctx.local?.nombre ?? ctx.clientName

  const selector =
    ctx.memberships.length > 1 ? (
      <form action={switchClient} className="flex items-center gap-2">
        <label htmlFor="client-switch" className="sr-only">
          Cambiar de local
        </label>
        <select id="client-switch" name="clientId" defaultValue={ctx.clientId} className="min-w-0 flex-1 rounded-lg border bg-card px-2 py-1.5 text-sm">
          {ctx.memberships.map((m) => (
            <option key={m.clientId} value={m.clientId}>
              {m.clientName}
            </option>
          ))}
        </select>
        <button className="rounded-lg border px-2 py-1.5 text-xs font-semibold">Cambiar</button>
      </form>
    ) : null

  return (
    <div className="flex min-h-dvh bg-crema">
      <aside className="hidden w-64 shrink-0 flex-col gap-5 border-r bg-white p-5 md:flex">
        <Link href="/empresa" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={30} height={30} className="rounded-lg" />
          <span className="titulo text-base leading-tight text-bordo-osc">
            ReComiendo
            <br />
            <span className="text-xs font-normal text-muted-foreground">para locales</span>
          </span>
        </Link>

        <div className="space-y-2 rounded-xl bg-suave p-3">
          <p className="truncate text-sm font-bold text-bordo-osc">{nombre}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={ctx.status} />
            <span className="text-[11px] text-muted-foreground">{ctx.role === 'owner' ? 'Propietario' : 'Staff'}</span>
          </div>
          {selector}
        </div>

        <NavNegocio items={items} />

        <div className="mt-auto space-y-1 border-t pt-3">
          {ctx.local && (
            <Link
              href={`/local/${ctx.local.id}`}
              target="_blank"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="size-4" />
              Ver mi ficha pública
            </Link>
          )}
          <p className="truncate px-3 text-xs text-muted-foreground">{ctx.user.email}</p>
          <form action={signOutAction.bind(null, '/empresa/ingresar')}>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="size-4" />
              Salir
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[1000] flex items-center justify-between gap-3 border-b bg-white px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <MenuMovil nombre={nombre} localId={ctx.local?.id ?? null} items={items} />
            <Link href="/empresa" className="flex min-w-0 items-center gap-2">
              <Image src="/logo.png" alt="" width={26} height={26} className="rounded-lg" />
              <span className="titulo truncate text-base text-bordo-osc">{nombre}</span>
            </Link>
          </div>
          <form action={signOutAction.bind(null, '/empresa/ingresar')}>
            <button aria-label="Salir" className="rounded-lg border px-2 py-1.5 text-xs font-semibold">
              Salir
            </button>
          </form>
        </header>
        {ctx.readOnly && (
          <div role="status" className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>
                Tu cuenta está {ctx.status === 'paused' ? 'pausada' : 'dada de baja'}: el panel queda en modo solo lectura y tu local no se muestra en la
                app ni en las recomendaciones. Para reactivarla, respondé el último mail que te enviamos.
              </p>
            </div>
          </div>
        )}
        {ctx.status === 'past_due' && (
          <div role="status" className="border-b border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Tu abono está vencido. Regularizalo para evitar la pausa del servicio. Mirá el detalle en Plan y pagos.
          </div>
        )}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
