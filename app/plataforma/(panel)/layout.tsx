import { signOutAction } from '@/app/auth-actions'
import { Logo } from '@/components/brand/logo'
import { NavLinks } from '@/components/panel/nav-links'
import { PanelHeader } from '@/components/panel/ui'
import { requireSuperadmin } from '@/lib/guards'

// Guard en el servidor ANTES de responder: sin sesión o sin rol superadmin → 404.
export const instant = false

const links = [
  { href: '/plataforma', label: 'Resumen' },
  { href: '/plataforma/metricas', label: 'Métricas' },
  { href: '/plataforma/solicitudes', label: 'Solicitudes' },
  { href: '/plataforma/empresas', label: 'Clientes' },
  { href: '/plataforma/locales', label: 'Locales' },
  { href: '/plataforma/usuarios', label: 'Comensales' },
  { href: '/plataforma/resenas', label: 'Reseñas' },
  { href: '/plataforma/premios', label: 'Premios' },
  { href: '/plataforma/invitaciones', label: 'Invitaciones' },
  { href: '/plataforma/planes', label: 'Planes' },
  { href: '/plataforma/mails', label: 'Mails' },
  { href: '/plataforma/equipo', label: 'Equipo' },
  { href: '/plataforma/auditoria', label: 'Auditoría' },
  { href: '/plataforma/ajustes', label: 'Ajustes' },
]

export default async function PlatformPanelLayout({ children }: LayoutProps<'/plataforma'>) {
  const user = await requireSuperadmin()
  return (
    <>
      <PanelHeader
        brand={<Logo href="/plataforma" suffix="equipo" />}
        right={
          <>
            <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
            <form action={signOutAction.bind(null, '/plataforma/ingresar')}>
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Salir</button>
            </form>
          </>
        }
        nav={<NavLinks links={links} root="/plataforma" />}
      />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 lg:px-6">{children}</main>
    </>
  )
}
